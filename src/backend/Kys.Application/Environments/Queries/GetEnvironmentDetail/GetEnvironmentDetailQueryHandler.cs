using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Queries.GetEnvironmentDetail;

public sealed class GetEnvironmentDetailQueryHandler(IEnvironmentRepository repository)
    : IRequestHandler<GetEnvironmentDetailQuery, EnvironmentDetailDto?>
{
    public async Task<EnvironmentDetailDto?> Handle(GetEnvironmentDetailQuery request, CancellationToken ct)
    {
        var env = await repository.GetEnvironmentByIdAsync(request.EnvironmentId, ct);
        if (env is null) return null;

        var resources = env.Resources.Select(r => new EnvironmentResourceDto(
            r.Id,
            r.ProductResourceTemplate.ResourceType.Name,
            r.ProductResourceTemplate.ResourceType.Code,
            r.ProductResourceTemplate.Name,
            r.IsShared,
            r.SharedResourceId,
            r.SharedResource?.Name,
            r.IsActive,
            r.Notes,
            r.Credentials.Select(c => new CredentialStubDto(c.Id, c.FieldKey, c.LastRotatedAt)).ToList())).ToList();

        var endpoints = env.Endpoints.Select(e => new EndpointUrlDto(
            e.Id,
            e.ProductEndpointId,
            e.ProductEndpoint.Name,
            e.ProductEndpoint.EndpointType.ToString(),
            e.BaseUrl,
            e.SwaggerUrl,
            e.HealthCheckUrl,
            e.IsActive)).ToList();

        var availableTemplates = env.CustomerProduct.Product.ResourceTemplates
            .OrderBy(t => t.SortOrder)
            .Select(t => new AvailableResourceTemplateDto(
                t.Id, t.Name, t.ResourceType.Name, t.IsRequired, t.CanBeShared))
            .ToList();

        return new EnvironmentDetailDto(
            env.Id,
            env.CustomerProductId,
            env.CustomerProduct.ProductId,
            env.Name,
            env.EnvironmentType.Name,
            env.EnvironmentType.Code,
            env.EnvironmentType.Color,
            env.IsActive,
            env.Notes,
            resources,
            endpoints,
            availableTemplates);
    }
}
