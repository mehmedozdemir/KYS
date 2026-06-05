using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Products.Commands.CreateProductEndpoint;

public sealed record CreateProductEndpointCommand(
    Guid ProductId,
    string Name,
    EndpointType EndpointType,
    string? Description,
    int SortOrder,
    string? DefaultBaseUrl,
    string? SwaggerUrl,
    string? HealthCheckUrl,
    AuthType DefaultAuthType
) : IRequest<Guid>;
