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

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        cp.Status = request.NewStatus;

        if (request.NewStatus == CustomerProductStatus.Active)
        {
            // Go-live tarihi verilmezse bugün; müşterinin canlıya geçiş tarihi en erken ürünün tarihidir.
            cp.GoLiveAt = request.GoLiveAt ?? cp.GoLiveAt ?? today;
            var customer = await customerRepository.GetByIdAsync(request.CustomerId, cancellationToken)
                ?? throw new NotFoundException(nameof(Customer), request.CustomerId);
            customer.MarkProductionLive(cp.GoLiveAt.Value);
            customerRepository.Update(customer);
        }

        if (request.NewStatus == CustomerProductStatus.Discontinued)
            cp.DiscontinuedAt = request.DiscontinuedAt ?? today;

        customerRepository.UpdateCustomerProduct(cp);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
