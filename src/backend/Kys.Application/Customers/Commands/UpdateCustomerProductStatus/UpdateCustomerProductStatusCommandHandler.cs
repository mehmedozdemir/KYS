using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Commands.UpdateCustomerProductStatus;

public sealed class UpdateCustomerProductStatusCommandHandler(
    ICustomerRepository customerRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateCustomerProductStatusCommand>
{
    public async Task Handle(UpdateCustomerProductStatusCommand request, CancellationToken cancellationToken)
    {
        var cp = await customerRepository.GetCustomerProductAsync(
            request.CustomerId, request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(CustomerProduct), $"{request.CustomerId}/{request.ProductId}");

        cp.Status = request.NewStatus;

        if (request.NewStatus == CustomerProductStatus.Active && request.GoLiveAt is not null)
            cp.GoLiveAt = request.GoLiveAt;

        if (request.NewStatus == CustomerProductStatus.Discontinued)
            cp.DiscontinuedAt = request.DiscontinuedAt ?? DateOnly.FromDateTime(DateTime.UtcNow);

        customerRepository.UpdateCustomerProduct(cp);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
