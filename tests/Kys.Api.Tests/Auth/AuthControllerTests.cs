using System.Net;
using System.Net.Http.Json;
using Kys.Api.Tests.Infrastructure;

namespace Kys.Api.Tests.Auth;

public sealed class AuthControllerTests(KysWebApplicationFactory factory)
    : IntegrationTestBase(factory)
{
    // ── Login ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ValidCredentials_Returns200WithTokens()
    {
        var response = await Client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            Email = KysWebApplicationFactory.TestAdminEmail,
            Password = KysWebApplicationFactory.TestAdminPassword,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<LoginResult>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(body.RefreshToken));
        Assert.Equal(KysWebApplicationFactory.TestAdminId, body.PersonId);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns403()
    {
        var response = await Client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            Email = KysWebApplicationFactory.TestAdminEmail,
            Password = "wrong-password",
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Login_UnknownEmail_Returns403()
    {
        var response = await Client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            Email = "nobody@kys.local",
            Password = "any-password",
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Login_MissingEmail_Returns422()
    {
        var response = await Client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            Email = "",
            Password = KysWebApplicationFactory.TestAdminPassword,
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    // ── Refresh ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Refresh_ValidToken_Returns200WithNewTokens()
    {
        // Login first to get a refresh token
        var loginResp = await Client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            Email = KysWebApplicationFactory.TestAdminEmail,
            Password = KysWebApplicationFactory.TestAdminPassword,
        });
        var login = await loginResp.Content.ReadFromJsonAsync<LoginResult>();

        var response = await Client.PostAsJsonAsync("/api/v1/auth/refresh", new
        {
            login!.PersonId,
            login.RefreshToken,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<RefreshResult>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body.AccessToken));
    }

    [Fact]
    public async Task Refresh_InvalidToken_Returns401()
    {
        var response = await Client.PostAsJsonAsync("/api/v1/auth/refresh", new
        {
            PersonId = KysWebApplicationFactory.TestAdminId,
            RefreshToken = "not-a-real-token",
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Protected endpoints ────────────────────────────────────────────────

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_Returns401()
    {
        var response = await Client.GetAsync("/api/v1/people");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithValidToken_Returns200()
    {
        await AuthenticateAsync();

        var response = await Client.GetAsync("/api/v1/people");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── DTOs ───────────────────────────────────────────────────────────────

    private sealed record LoginResult(
        string AccessToken,
        string RefreshToken,
        int ExpiresIn,
        Guid PersonId,
        string FullName,
        IReadOnlyList<string> Permissions);

    private sealed record RefreshResult(string AccessToken, int ExpiresIn);
}
