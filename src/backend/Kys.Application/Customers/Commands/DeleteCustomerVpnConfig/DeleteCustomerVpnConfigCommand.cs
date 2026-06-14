using MediatR;

namespace Kys.Application.Customers.Commands.DeleteCustomerVpnConfig;

public sealed record DeleteCustomerVpnConfigCommand(Guid Id) : IRequest;
