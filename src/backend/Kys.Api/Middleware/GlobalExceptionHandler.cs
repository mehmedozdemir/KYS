using System.Text.Json;
using FluentValidation;
using Kys.Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Middleware;

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, detail, errors) = exception switch
        {
            ValidationException ve => (
                StatusCodes.Status422UnprocessableEntity,
                "One or more validation errors occurred.",
                ve.Errors.GroupBy(e => e.PropertyName)
                         .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())),

            NotFoundException nfe => (StatusCodes.Status404NotFound, nfe.Message, (Dictionary<string, string[]>?)null),
            UnauthorizedException ue => (StatusCodes.Status401Unauthorized, ue.Message, (Dictionary<string, string[]>?)null),
            ForbiddenException fe => (StatusCodes.Status403Forbidden, fe.Message, (Dictionary<string, string[]>?)null),
            ConflictException ce => (StatusCodes.Status409Conflict, ce.Message, (Dictionary<string, string[]>?)null),
            DomainException de => (StatusCodes.Status400BadRequest, de.Message, (Dictionary<string, string[]>?)null),

            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.", (Dictionary<string, string[]>?)null)
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "Unhandled exception");

        var correlationId = httpContext.Items["CorrelationId"]?.ToString();

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(statusCode),
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

    private static string GetTitle(int statusCode) => statusCode switch
    {
        422 => "Validation Error",
        404 => "Not Found",
        401 => "Unauthorized",
        409 => "Conflict",
        403 => "Forbidden",
        400 => "Bad Request",
        _ => "Internal Server Error"
    };
}
