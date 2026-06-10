using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.RemoveTeamFromProduct;

public sealed class RemoveTeamFromProductCommandHandler(
    IProductRepository productRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<RemoveTeamFromProductCommand>
{
    public async Task Handle(RemoveTeamFromProductCommand request, CancellationToken ct)
    {
        var assignment = await productRepository.GetTeamAssignmentAsync(request.ProductId, request.TeamId, ct)
            ?? throw new NotFoundException("ProductTeam", request.TeamId);

        productRepository.RemoveTeamAssignment(assignment);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
