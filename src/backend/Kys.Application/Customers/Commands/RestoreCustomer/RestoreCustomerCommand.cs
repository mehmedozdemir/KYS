using MediatR;

namespace Kys.Application.Customers.Commands.RestoreCustomer;

public sealed record RestoreCustomerCommand(Guid Id) : IRequest;
