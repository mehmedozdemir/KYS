using MediatR;

namespace Kys.Application.Environments.Queries.GetCustomerEnvironments;

public sealed record GetCustomerEnvironmentsQuery(Guid CustomerProductId)
    : IRequest<IReadOnlyList<CustomerEnvironmentSummaryDto>>;

public sealed record CustomerEnvironmentSummaryDto(
    Guid Id,
    string Name,
    string EnvironmentTypeName,
    string EnvironmentTypeCode,
    string? EnvironmentTypeColor,
    bool IsActive,
    int ResourceCount,
    int EndpointCount,
    string? Notes);
