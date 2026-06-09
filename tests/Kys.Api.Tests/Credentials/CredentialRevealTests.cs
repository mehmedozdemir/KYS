using System.Net;
using System.Net.Http.Json;
using Kys.Api.Tests.Infrastructure;
using Kys.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kys.Api.Tests.Credentials;

public sealed class CredentialRevealTests(KysWebApplicationFactory factory)
    : IntegrationTestBase(factory)
{
    private readonly TestDataSeeder _seeder = new(factory);

    // ── Unauthenticated ────────────────────────────────────────────────────

    [Fact]
    public async Task Reveal_WithoutToken_Returns401()
    {
        var response = await Client.GetAsync($"/api/v1/credentials/{Guid.NewGuid()}/reveal");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Missing permission ─────────────────────────────────────────────────

    [Fact]
    public async Task Reveal_WithoutCredentialsViewPermission_Returns403()
    {
        // A platform user with no system role has no permissions
        var user = await _seeder.CreatePlatformUserAsync("noroles@kys.local", "Test@1234!");
        await AuthenticateAsync("noroles@kys.local", "Test@1234!");

        var response = await Client.GetAsync($"/api/v1/credentials/{Guid.NewGuid()}/reveal");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── Happy path: set + reveal ───────────────────────────────────────────

    [Fact]
    public async Task SetAndReveal_AsPlatformAdmin_Returns200WithDecryptedValue()
    {
        await AuthenticateAsync(); // PlatformAdmin

        var (_, _, _, resource) = await _seeder.CreateEnvironmentResourceChainAsync();

        const string plainValue = "super-secret-db-password";

        // Set the credential
        var setResp = await Client.PutAsJsonAsync("/api/v1/credentials", new
        {
            EnvironmentResourceId = resource.Id,
            SharedResourceId = (Guid?)null,
            EndpointUrlId = (Guid?)null,
            FieldKey = "password",
            PlainValue = plainValue,
        });
        Assert.Equal(HttpStatusCode.OK, setResp.StatusCode);

        var setResult = await setResp.Content.ReadFromJsonAsync<SetCredentialResult>();
        Assert.NotEqual(Guid.Empty, setResult!.Id);

        // Reveal the credential
        var revealResp = await Client.GetAsync($"/api/v1/credentials/{setResult.Id}/reveal");
        Assert.Equal(HttpStatusCode.OK, revealResp.StatusCode);

        var revealResult = await revealResp.Content.ReadFromJsonAsync<RevealResult>();
        Assert.Equal(plainValue, revealResult!.Value);
    }

    // ── Audit log ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Reveal_WritesAuditLogEntry()
    {
        await AuthenticateAsync();

        var (_, _, _, resource) = await _seeder.CreateEnvironmentResourceChainAsync();

        var setResp = await Client.PutAsJsonAsync("/api/v1/credentials", new
        {
            EnvironmentResourceId = resource.Id,
            SharedResourceId = (Guid?)null,
            EndpointUrlId = (Guid?)null,
            FieldKey = "host",
            PlainValue = "db.internal",
        });
        var setResult = await setResp.Content.ReadFromJsonAsync<SetCredentialResult>();

        await Client.GetAsync($"/api/v1/credentials/{setResult!.Id}/reveal");

        // Verify audit log written
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var auditEntry = await db.AuditLogs
            .Where(a => a.Action == "CredentialRevealed" && a.EntityId == setResult.Id)
            .FirstOrDefaultAsync();

        Assert.NotNull(auditEntry);
        Assert.Equal(KysWebApplicationFactory.TestAdminId, auditEntry.ChangedBy);
    }

    // ── Non-existent credential ────────────────────────────────────────────

    [Fact]
    public async Task Reveal_NonExistentCredential_Returns400()
    {
        await AuthenticateAsync();

        var response = await Client.GetAsync($"/api/v1/credentials/{Guid.NewGuid()}/reveal");

        // DomainException → 500 (global handler)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Update existing credential ─────────────────────────────────────────

    [Fact]
    public async Task Set_SameFieldKey_UpdatesExistingCredential()
    {
        await AuthenticateAsync();

        var (_, _, _, resource) = await _seeder.CreateEnvironmentResourceChainAsync();

        var payload = new
        {
            EnvironmentResourceId = resource.Id,
            SharedResourceId = (Guid?)null,
            EndpointUrlId = (Guid?)null,
            FieldKey = "username",
            PlainValue = "initial-user",
        };

        var firstSet = await Client.PutAsJsonAsync("/api/v1/credentials", payload);
        var firstId = (await firstSet.Content.ReadFromJsonAsync<SetCredentialResult>())!.Id;

        // Update same field key
        var secondSet = await Client.PutAsJsonAsync("/api/v1/credentials",
            payload with { PlainValue = "updated-user" });
        var secondId = (await secondSet.Content.ReadFromJsonAsync<SetCredentialResult>())!.Id;

        // Same record ID — no duplicate created
        Assert.Equal(firstId, secondId);

        // Value reflects the update
        var revealResp = await Client.GetAsync($"/api/v1/credentials/{firstId}/reveal");
        var revealed = await revealResp.Content.ReadFromJsonAsync<RevealResult>();
        Assert.Equal("updated-user", revealed!.Value);
    }

    // ── DTOs ───────────────────────────────────────────────────────────────

    private sealed record SetCredentialResult(Guid Id);
    private sealed record RevealResult(string Value);
}
