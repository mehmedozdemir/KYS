using System.Text.Json;
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
                    e.HostingPlatform?.Name,
                    e.HostingPlatform?.Icon,
                    e.HostingPlatform?.Color,
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
                                .Select(c => new WorkspaceCredentialDto(c.Id, c.FieldKey, SecretEndpointFieldKeys.Contains(c.FieldKey)))
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
                                .Select(c => new WorkspaceCredentialDto(c.Id, c.FieldKey,
                                    IsSecretSchemaField(r.ProductResourceTemplate.ResourceType.FieldSchema, c.FieldKey)))
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

    // Endpoint auth alanlarından şifreli olanlar (env-detay ile aynı set)
    private static readonly HashSet<string> SecretEndpointFieldKeys =
        new(StringComparer.OrdinalIgnoreCase) { "password", "clientSecret", "token", "apiKey" };

    // Kaynak alanının ResourceType.FieldSchema'da "password" tipinde olup olmadığı
    private static bool IsSecretSchemaField(IReadOnlyDictionary<string, object?> schema, string fieldKey)
    {
        if (schema is null || !schema.TryGetValue(fieldKey, out var def) || def is null)
            return false;

        if (def is JsonElement el)
        {
            return el.ValueKind == JsonValueKind.Object
                && el.TryGetProperty("type", out var t)
                && string.Equals(t.GetString(), "password", StringComparison.OrdinalIgnoreCase);
        }

        if (def is IDictionary<string, object?> dict && dict.TryGetValue("type", out var tv))
            return string.Equals(tv?.ToString(), "password", StringComparison.OrdinalIgnoreCase);

        return false;
    }
}
