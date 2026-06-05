using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Commands.UpdateCustomer;

public sealed class UpdateCustomerCommandHandler(
    ICustomerRepository customerRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateCustomerCommand>
{
    public async Task Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await customerRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Customer), request.Id);

        customer.Name = request.Name;
        customer.ShortName = request.ShortName;
        customer.Description = request.Description;
        customer.Sector = request.Sector;
        customer.Country = request.Country;
        customer.City = request.City;
        customer.PrimaryContactName = request.PrimaryContactName;
        customer.PrimaryContactEmail = request.PrimaryContactEmail;
        customer.PrimaryContactPhone = request.PrimaryContactPhone;
        customer.CustomFields = request.CustomFields ?? [];

        customerRepository.Update(customer);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
