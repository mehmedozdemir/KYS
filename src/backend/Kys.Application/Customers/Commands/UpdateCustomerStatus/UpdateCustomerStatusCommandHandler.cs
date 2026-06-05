using Kys.Domain.Enumerations;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Commands.UpdateCustomerStatus;

public sealed class UpdateCustomerStatusCommandHandler(
    ICustomerRepository customerRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateCustomerStatusCommand>
{
    public async Task Handle(UpdateCustomerStatusCommand request, CancellationToken cancellationToken)
    {
        var customer = await customerRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Customer), request.Id);

        if (request.NewStatus == CustomerStatus.Churned)
        {
            if (request.ServiceEndedAt is null)
                throw new DomainException("Churned durumu için service_ended_at zorunludur.");

            customer.Churn(request.ServiceEndedAt.Value, request.ChurnReason);
        }
        else
        {
            customer.Status = request.NewStatus;
        }

        customerRepository.Update(customer);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
