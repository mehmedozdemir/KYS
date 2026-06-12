using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.AssignTeamToProduct;

public sealed class AssignTeamToProductCommandHandler(
    IProductRepository productRepository,
    ITeamRepository teamRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<AssignTeamToProductCommand>
{
    public async Task Handle(AssignTeamToProductCommand request, CancellationToken cancellationToken)
    {
        _ = await productRepository.GetByIdAsync(request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        _ = await teamRepository.GetByIdAsync(request.TeamId, cancellationToken)
            ?? throw new NotFoundException(nameof(Team), request.TeamId);

        var existing = await productRepository.GetTeamAssignmentAsync(request.ProductId, request.TeamId, cancellationToken);
        if (existing is not null)
            throw new DomainException("err.product.teamAlreadyAssigned");

        var assignment = new ProductTeam
        {
            ProductId = request.ProductId,
            TeamId = request.TeamId,
            Role = request.Role,
            Since = request.Since
        };

        await productRepository.AddTeamAssignmentAsync(assignment, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
