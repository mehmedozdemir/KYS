using MediatR;

namespace Kys.Application.Customers.Commands.RemoveCustomerProduct;

public sealed record RemoveCustomerProductCommand(Guid CustomerProductId) : IRequest;
