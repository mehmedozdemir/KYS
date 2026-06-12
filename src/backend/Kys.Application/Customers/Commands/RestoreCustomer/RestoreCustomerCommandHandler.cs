using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Commands.RestoreCustomer;

public sealed class RestoreCustomerCommandHandler(
    ICustomerRepository customerRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<RestoreCustomerCommand>
{
    public async Task Handle(RestoreCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await customerRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Customer), request.Id);

        if (!customer.IsArchived)
            throw new DomainException("err.customer.notArchived");

        customer.Restore();
        customerRepository.Update(customer);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
