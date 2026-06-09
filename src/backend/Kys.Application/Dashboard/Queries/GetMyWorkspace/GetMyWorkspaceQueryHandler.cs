using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Dashboard.Queries.GetMyWorkspace;

public sealed class GetMyWorkspaceQueryHandler(
    IDashboardRepository repository,
    ICurrentUserService currentUser)
    : IRequestHandler<GetMyWorkspaceQuery, IReadOnlyList<WorkspaceCustomerDto>>
{
    public async Task<IReadOnlyList<WorkspaceCustomerDto>> Handle(GetMyWorkspaceQuery request, CancellationToken ct)
    {
        var personId = currentUser.UserId;
        if (personId is null) return [];

        var environments = await repository.GetWorkspaceEnvironmentsAsync(personId.Value, request.AllCustomers, ct);

        return environments
            .GroupBy(e => e.CustomerProduct.CustomerId)
            .Select(customerGroup =>
            {
                var customer = customerGroup.First().CustomerProduct.Customer;
                var products = customerGroup
                    .Select(e => e.CustomerProduct.Product.Name)
                    .Distinct()
                    .OrderBy(name => name)
                    .ToList();

                var environmentDtos = customerGroup.Select(e => new WorkspaceEnvironmentDto(
                    e.Id,
                    e.CustomerProduct.Product.Name,
                    e.Name,
                    e.EnvironmentType.Name,
                    e.EnvironmentType.Code,
                    e.EnvironmentType.Color,
                    e.Endpoints
                        .OrderBy(ep => ep.ProductEndpoint.SortOrder)
                        .Select(ep => new WorkspaceEndpointDto(
                            ep.ProductEndpoint.Name,
                            ep.ProductEndpoint.EndpointType.ToString(),
                            ep.BaseUrl,
                            ep.SwaggerUrl,
                            ep.HealthCheckUrl,
                            ep.AuthType?.ToString(),
                            ep.Credentials.Count,
                            ep.Credentials
                                .Select(c => new WorkspaceCredentialDto(c.Id, c.FieldKey))
                                .ToList()))
                        .ToList(),
                    e.Resources
                        .Where(r => r.IsActive)
                        .OrderBy(r => r.ProductResourceTemplate.SortOrder)
                        .Select(r => new WorkspaceResourceDto(
                            r.ProductResourceTemplate.Name,
                            r.ProductResourceTemplate.ResourceType.Name,
                            r.ProductResourceTemplate.ResourceType.Code,
                            r.IsShared,
                            r.SharedResource?.Name,
                            r.Credentials.Count,
                            r.Credentials
                                .Select(c => new WorkspaceCredentialDto(c.Id, c.FieldKey))
                                .ToList()))
                        .ToList()))
                    .ToList();

                return new WorkspaceCustomerDto(
                    customer.Id,
                    customer.Name,
                    customer.Code,
                    products,
                    environmentDtos);
            })
            .ToList();
    }
}
