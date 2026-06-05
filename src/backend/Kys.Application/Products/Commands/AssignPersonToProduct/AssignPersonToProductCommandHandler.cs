using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.AssignPersonToProduct;

public sealed class AssignPersonToProductCommandHandler(
    IProductRepository productRepository,
    IPersonRepository personRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<AssignPersonToProductCommand, Guid>
{
    public async Task<Guid> Handle(AssignPersonToProductCommand request, CancellationToken cancellationToken)
    {
        _ = await productRepository.GetByIdAsync(request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        _ = await personRepository.GetByIdAsync(request.PersonId, cancellationToken)
            ?? throw new NotFoundException(nameof(Person), request.PersonId);

        var existing = await productRepository.GetPersonAssignmentAsync(request.ProductId, request.PersonId, cancellationToken);
        if (existing is not null)
            throw new DomainException("Person already has an active assignment on this product.");

        var assignment = new ProductAssignment
        {
            ProductId = request.ProductId,
            PersonId = request.PersonId,
            Responsibility = request.Responsibility,
            StartedAt = request.StartedAt,
            IsActive = true
        };

        await productRepository.AddPersonAssignmentAsync(assignment, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return assignment.Id;
    }
}
