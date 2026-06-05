using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Products.Commands.UpdateProductEndpoint;

public sealed record UpdateProductEndpointCommand(
    Guid Id,
    string Name,
    string? Description,
    int SortOrder,
    string? DefaultBaseUrl,
    string? SwaggerUrl,
    string? HealthCheckUrl,
    AuthType DefaultAuthType
) : IRequest;
