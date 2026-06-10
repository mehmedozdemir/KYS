using MediatR;

namespace Kys.Application.Products.Commands.RemoveTeamFromProduct;

public sealed record RemoveTeamFromProductCommand(Guid ProductId, Guid TeamId) : IRequest;
