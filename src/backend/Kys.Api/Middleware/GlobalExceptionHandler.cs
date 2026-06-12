using System.Text.Json;
using FluentValidation;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Services;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Middleware;

public sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    ILocalizer localizer) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // Exception/validation messages carry localization keys (with literal fallback);
        // resolve them to the current request culture here.
        var (statusCode, detail, errors) = exception switch
        {
            ValidationException ve => (
                StatusCodes.Status422UnprocessableEntity,
                localizer["error.validationOccurred"],
                ve.Errors.GroupBy(e => e.PropertyName)
                         .ToDictionary(g => g.Key, g => g.Select(e => localizer[e.ErrorMessage]).ToArray())),

            NotFoundException => (StatusCodes.Status404NotFound, localizer["error.notFound"], (Dictionary<string, string[]>?)null),
            UnauthorizedException ue => (StatusCodes.Status401Unauthorized, localizer[ue.Message], (Dictionary<string, string[]>?)null),
            ForbiddenException fe => (StatusCodes.Status403Forbidden, localizer[fe.Message], (Dictionary<string, string[]>?)null),
            ConflictException ce => (StatusCodes.Status409Conflict, localizer[ce.Message], (Dictionary<string, string[]>?)null),
            DomainException de => (StatusCodes.Status400BadRequest, localizer[de.Message], (Dictionary<string, string[]>?)null),

            _ => (StatusCodes.Status500InternalServerError, localizer["error.unexpected"], (Dictionary<string, string[]>?)null)
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "Unhandled exception");

        var correlationId = httpContext.Items["CorrelationId"]?.ToString();

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = localizer[$"error.title.{statusCode}"],
            Detail = detail,
            Instance = httpContext.Request.Path
        };

        if (correlationId is not null)
            problem.Extensions["correlationId"] = correlationId;

        if (errors is not null)
            problem.Extensions["errors"] = errors;

        await httpContext.Response.WriteAsync(
            JsonSerializer.Serialize(problem),
            cancellationToken);

        return true;
    }
}
