using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Customers.Commands.UpdateCustomerVpnConfig;

public sealed record UpdateCustomerVpnConfigCommand(
    Guid Id,
    Guid? CustomerEnvironmentId,
    string Name,
    VpnType VpnType,
    string ServerHost,
    int? ServerPort,
    string? Username,
    string? PlainPassword,
    string? Notes,
    bool IsActive,
    int SortOrder) : IRequest;
