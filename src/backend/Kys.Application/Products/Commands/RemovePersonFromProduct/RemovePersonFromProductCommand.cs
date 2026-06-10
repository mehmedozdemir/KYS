using MediatR;

namespace Kys.Application.Products.Commands.RemovePersonFromProduct;

public sealed record RemovePersonFromProductCommand(Guid ProductId, Guid PersonId) : IRequest;
