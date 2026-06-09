using System.Threading.RateLimiting;
using Kys.Domain.Entities;
using Kys.Infrastructure.Persistence;
using Npgsql;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Testcontainers.PostgreSql;

namespace Kys.Api.Tests.Infrastructure;

public sealed class KysWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("kys_test")
        .WithUsername("kys")
        .WithPassword("kys_test_pw")
        .Build();

    public static readonly Guid TestAdminId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    public const string TestAdminEmail = "testadmin@kys.local";
    public const string TestAdminPassword = "Test@1234!";

    public string ConnectionString => _postgres.GetConnectionString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = _postgres.GetConnectionString(),
                ["Jwt:Secret"] = "test-integration-secret-key-must-be-32-chars-min!",
                ["Jwt:Issuer"] = "kys-test",
                ["Jwt:Audience"] = "kys-test-clients",
                ["Jwt:ExpiryMinutes"] = "60",
                // 32 zero bytes (AES-256 key) and 16 zero bytes (IV) — safe for tests only
                ["Encryption:Key"] = Convert.ToBase64String(new byte[32]),
                ["Encryption:IV"] = Convert.ToBase64String(new byte[16]),
            });
        });

        builder.ConfigureServices(services =>
        {
            // Replace the production NpgsqlDataSource with the Testcontainer one
            services.RemoveAll<NpgsqlDataSource>();
            services.AddSingleton(_ =>
                new NpgsqlDataSourceBuilder(_postgres.GetConnectionString())
                    .EnableDynamicJson()
                    .Build());

            // Replace rate limiting policies with no-limit versions so tests are never throttled
            services.RemoveAll<IConfigureOptions<RateLimiterOptions>>();
            services.Configure<RateLimiterOptions>(opts =>
            {
                opts.RejectionStatusCode = 429;
                opts.AddPolicy("global", _ => RateLimitPartition.GetNoLimiter("test"));
                opts.AddPolicy("auth", _ => RateLimitPartition.GetNoLimiter("test"));
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await SeedTestAdminAsync(db, scope.ServiceProvider);
    }

    public new async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await base.DisposeAsync();
    }

    public async Task ResetDatabaseAsync(Respawn.Respawner respawner, System.Data.Common.DbConnection connection)
    {
        await respawner.ResetAsync(connection);

        // Re-seed test admin after each reset
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await SeedTestAdminAsync(db, scope.ServiceProvider);
    }

    private static async Task SeedTestAdminAsync(AppDbContext db, IServiceProvider sp)
    {
        if (await db.People.AnyAsync(p => p.Id == TestAdminId))
            return;

        var hasher = sp.GetRequiredService<IPasswordHasher<Person>>();
        var admin = new Person
        {
            Id = TestAdminId,
            FirstName = "Test",
            LastName = "Admin",
            Email = TestAdminEmail,
            IsPlatformUser = true,
        };
        admin.PasswordHash = hasher.HashPassword(admin, TestAdminPassword);
        db.People.Add(admin);

        var platformAdminRole = await db.Set<SystemRole>().FirstAsync(r => r.Code == "PlatformAdmin");
        db.Set<PersonSystemRole>().Add(new PersonSystemRole
        {
            PersonId = admin.Id,
            SystemRoleId = platformAdminRole.Id,
            AssignedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
    }
}
