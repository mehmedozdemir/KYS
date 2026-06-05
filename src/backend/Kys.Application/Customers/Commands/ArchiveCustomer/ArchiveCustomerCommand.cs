using MediatR;

namespace Kys.Application.Customers.Commands.ArchiveCustomer;

public sealed record ArchiveCustomerCommand(Guid Id) : IRequest;
