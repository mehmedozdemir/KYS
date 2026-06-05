using MediatR;

namespace Kys.Application.Products.Commands.AssignTeamToProduct;

public sealed record AssignTeamToProductCommand(
    Guid ProductId,
    Guid TeamId,
    string? Role,
    DateOnly? Since
) : IRequest;
