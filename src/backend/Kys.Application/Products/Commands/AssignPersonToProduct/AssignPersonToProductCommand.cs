using MediatR;

namespace Kys.Application.Products.Commands.AssignPersonToProduct;

public sealed record AssignPersonToProductCommand(
    Guid ProductId,
    Guid PersonId,
    string? Responsibility,
    DateOnly? StartedAt
) : IRequest<Guid>;
