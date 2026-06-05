using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.CreateCustomerEnvironment;

public sealed class CreateCustomerEnvironmentCommandHandler(
    IEnvironmentRepository envRepository,
    ICustomerRepository customerRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateCustomerEnvironmentCommand, Guid>
{
    public async Task<Guid> Handle(CreateCustomerEnvironmentCommand request, CancellationToken ct)
    {
        var customerProduct = await customerRepository.GetCustomerProductByIdAsync(request.CustomerProductId, ct)
            ?? throw new DomainException($"CustomerProduct {request.CustomerProductId} not found.");

        var envType = await envRepository.GetEnvironmentTypeByIdAsync(request.EnvironmentTypeId, ct)
            ?? throw new DomainException($"EnvironmentType {request.EnvironmentTypeId} not found.");

        if (!envType.IsActive)
            throw new DomainException($"EnvironmentType '{envType.Name}' is not active.");

        var environment = new CustomerEnvironment
        {
            CustomerProductId = customerProduct.Id,
            EnvironmentTypeId = envType.Id,
            Name = request.Name,
            Notes = request.Notes
        };

        await envRepository.AddCustomerEnvironmentAsync(environment, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return environment.Id;
    }
}
