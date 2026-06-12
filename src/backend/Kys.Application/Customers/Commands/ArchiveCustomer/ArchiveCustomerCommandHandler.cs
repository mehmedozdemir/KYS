using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Commands.ArchiveCustomer;

public sealed class ArchiveCustomerCommandHandler(
    ICustomerRepository customerRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<ArchiveCustomerCommand>
{
    public async Task Handle(ArchiveCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await customerRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Customer), request.Id);

        if (customer.IsArchived)
            throw new DomainException("err.customer.alreadyArchived");

        customer.Archive();
        customerRepository.Update(customer);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
