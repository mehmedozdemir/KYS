using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Customers.Commands.CreateCustomerVpnConfig;

public sealed record CreateCustomerVpnConfigCommand(
    Guid CustomerId,
    Guid? CustomerEnvironmentId,
    string Name,
    VpnType VpnType,
    string ServerHost,
    int? ServerPort,
    string? Username,
    string? PlainPassword,
    string? Notes,
    bool IsActive,
    int SortOrder) : IRequest<Guid>;
