using System.Net.Http.Headers;
using System.Net.Http.Json;
using Npgsql;
using Respawn;

namespace Kys.Api.Tests.Infrastructure;

public abstract class IntegrationTestBase : IClassFixture<KysWebApplicationFactory>, IAsyncLifetime
{
    protected readonly KysWebApplicationFactory Factory;
    protected readonly HttpClient Client;

    private Respawner _respawner = null!;
    private NpgsqlConnection _connection = null!;

    protected IntegrationTestBase(KysWebApplicationFactory factory)
    {
        Factory = factory;
        Client = factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        _connection = new NpgsqlConnection(Factory.ConnectionString);
        await _connection.OpenAsync();

        _respawner = await Respawner.CreateAsync(_connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = ["public"],
            // Preserve migration-seeded reference data
            TablesToIgnore =
            [
                new Respawn.Graph.Table("system_roles"),
                new Respawn.Graph.Table("organization_roles"),
                new Respawn.Graph.Table("resource_types"),
                new Respawn.Graph.Table("environment_types"),
            ],
        });
    }

    public async Task DisposeAsync()
    {
        await Factory.ResetDatabaseAsync(_respawner, _connection);
        await _connection.DisposeAsync();
    }

    protected async Task AuthenticateAsync(string? email = null, string? password = null)
    {
        var response = await Client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            Email = email ?? KysWebApplicationFactory.TestAdminEmail,
            Password = password ?? KysWebApplicationFactory.TestAdminPassword,
        });

        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", result!.AccessToken);
    }

    private sealed record LoginResponse(string AccessToken, string RefreshToken);
}
