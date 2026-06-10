using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Products.Commands.UpdateProductEndpoint;

public sealed record UpdateProductEndpointCommand(
    Guid ProductId,
    Guid Id,
    string Name,
    string? Description,
    int SortOrder,
    string? DefaultBaseUrl,
    string? SwaggerUrl,
    string? HealthCheckUrl,
    AuthType DefaultAuthType
) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Product, ProductId);
}
