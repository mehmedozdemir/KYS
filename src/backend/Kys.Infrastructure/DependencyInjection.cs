using Dapper;
using Kys.Domain.Entities;
using Npgsql;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using Kys.Infrastructure.Persistence;
using Kys.Infrastructure.Persistence.Interceptors;
using Kys.Infrastructure.Persistence.Repositories;
using Kys.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kys.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Allow Dapper to map snake_case DB columns to PascalCase C# properties
        DefaultTypeMap.MatchNamesWithUnderscores = true;

        services.AddScoped<SoftDeleteInterceptor>();
        services.AddScoped<TimestampInterceptor>();
        services.AddScoped<AuditLogInterceptor>();

        // Lazy factory so tests can replace the data source before first resolution
        services.AddSingleton<NpgsqlDataSource>(sp =>
        {
            var cfg = sp.GetRequiredService<IConfiguration>();
            return new NpgsqlDataSourceBuilder(cfg.GetConnectionString("DefaultConnection"))
                .EnableDynamicJson()
                .Build();
        });

        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            options.UseNpgsql(
                sp.GetRequiredService<NpgsqlDataSource>(),
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
                .UseSnakeCaseNamingConvention()
                .AddInterceptors(
                    sp.GetRequiredService<SoftDeleteInterceptor>(),
                    sp.GetRequiredService<TimestampInterceptor>(),
                    sp.GetRequiredService<AuditLogInterceptor>());
        });

        // Repositories
        services.AddScoped<IPersonRepository, PersonRepository>();
        services.AddScoped<ITeamRepository, TeamRepository>();
        services.AddScoped<ITeamMembershipRepository, TeamMembershipRepository>();
        services.AddScoped<ISystemRoleRepository, SystemRoleRepository>();
        services.AddScoped<IAccessGrantRepository, AccessGrantRepository>();
        services.AddScoped<IEmailAccountRepository, EmailAccountRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICustomFieldDefinitionRepository, CustomFieldDefinitionRepository>();
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IEnvironmentRepository, EnvironmentRepository>();
        services.AddScoped<IResourceRepository, ResourceRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<ISearchRepository, SearchRepository>();
        services.AddScoped<IKbRepository, KbRepository>();
        services.AddScoped<IAuditLogQueryRepository, AuditLogQueryRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Services
        services.AddScoped<IResourceAuthorizationService, ResourceAuthorizationService>();
        services.AddScoped<Kys.Domain.Authorization.IScopeService, ScopeService>();
        services.AddScoped<Kys.Domain.Authorization.IGrantService, GrantService>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IAccountEmailService, AccountEmailService>();
        services.AddSingleton<EmailQueue>();
        services.AddSingleton<IEmailQueue>(sp => sp.GetRequiredService<EmailQueue>());
        services.AddHostedService<EmailBackgroundService>();
        services.AddSingleton<IEncryptionService, AesEncryptionService>();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddSingleton<IJwtService, JwtService>();

        // Password hasher
        services.AddScoped<IPasswordHasher<Person>, PasswordHasher<Person>>();

        return services;
    }
}
