using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Primitives;
using Kys.Api.Authorization;
using Kys.Api.Middleware;
using Kys.Api.Services;
using Kys.Domain.Interfaces.Services;

namespace Kys.Api.Extensions;

public static class PresentationExtensions
{
    public static IServiceCollection AddPresentation(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddControllers()
            .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddProblemDetails();

        services.AddJwtAuthentication(configuration);
        services.AddAuthorization();
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

        services.AddSwaggerWithVersioning();

        services.AddHealthChecks()
            .AddNpgSql(
                configuration.GetConnectionString("DefaultConnection")!,
                name: "postgresql",
                tags: ["ready", "db"]);

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Genel API limiti: IP başına 150 istek/dakika
            options.AddPolicy("global", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetClientIp(httpContext),
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 150,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            // Auth limiti: IP başına 10 istek/15 dakika (brute-force koruması)
            options.AddPolicy("auth", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: "auth:" + GetClientIp(httpContext),
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(15),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));
        });

        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy
                    .WithOrigins(
                        configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                        ?? ["http://localhost:4200"])
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }

    private static string GetClientIp(HttpContext ctx)
    {
        // X-Forwarded-For (Nginx / proxy arkasında)
        if (ctx.Request.Headers.TryGetValue("X-Forwarded-For", out StringValues forwarded))
        {
            var first = forwarded.ToString().Split(',')[0].Trim();
            if (!string.IsNullOrEmpty(first)) return first;
        }
        return ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
