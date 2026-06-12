using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Customers.Commands.CreateCustomer;

public sealed class CreateCustomerCommandHandler(
    ICustomerRepository customerRepository,
    IUnitOfWork unitOfWork,
    ILocalizer localizer
) : IRequestHandler<CreateCustomerCommand, Guid>
{
    public async Task<Guid> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        if (await customerRepository.ExistsByCodeAsync(request.Code, cancellationToken))
            throw new DomainException(localizer.Get("err.customer.codeExists", request.Code));

        var customer = new Customer
        {
            Name = request.Name,
            Code = request.Code.ToUpperInvariant(),
            ShortName = request.ShortName,
            Description = request.Description,
            Sector = request.Sector,
            Country = request.Country,
            City = request.City,
            PrimaryContactName = request.PrimaryContactName,
            PrimaryContactEmail = request.PrimaryContactEmail,
            PrimaryContactPhone = request.PrimaryContactPhone,
            CustomFields = request.CustomFields ?? []
        };

        await customerRepository.AddAsync(customer, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return customer.Id;
    }
}
