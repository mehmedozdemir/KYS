using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Customers.Queries.GetCustomerVpnConfigs;

public sealed record GetCustomerVpnConfigsQuery(Guid CustomerId) : IRequest<IReadOnlyList<CustomerVpnConfigDto>>;

public sealed record CustomerVpnConfigDto(
    Guid Id,
    Guid CustomerId,
    Guid? CustomerEnvironmentId,
    string? EnvironmentName,
    string Name,
    VpnType VpnType,
    string ServerHost,
    int? ServerPort,
    string? Username,
    bool HasPassword,
    string? Notes,
    bool IsActive,
    int SortOrder,
    DateTime UpdatedAt);
