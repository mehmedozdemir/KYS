using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Commands.DeleteCustomer;

public sealed class DeleteCustomerCommandHandler(
    ICustomerRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteCustomerCommand>
{
    public async Task Handle(DeleteCustomerCommand request, CancellationToken ct)
    {
        var customer = await repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("Customer", request.Id);

        customer.IsDeleted = true;
        customer.DeletedAt = DateTime.UtcNow;

        repository.Update(customer);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
