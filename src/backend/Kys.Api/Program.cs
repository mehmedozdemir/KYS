using Kys.Api.Extensions;
using Kys.Api.Middleware;
using Kys.Application;
using Kys.Infrastructure;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting KYS API");

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, config) =>
    {
        config
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .Enrich.WithMachineName()
            .WriteTo.Console()
            .WriteTo.File(
                "logs/kys-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30);
    });

    builder.Services
        .AddApplication()
        .AddInfrastructure(builder.Configuration)
        .AddPresentation(builder.Configuration);

    var app = builder.Build();

    app.UseExceptionHandler();
    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "KYS API v1");
            c.RoutePrefix = "swagger";
        });
    }

    app.UseCors("AllowFrontend");
    app.UseHttpsRedirection();
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers().RequireRateLimiting("global");

    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = _ => false
    });

    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready")
    });

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "KYS API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
