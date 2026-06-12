using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Environments.Commands.CreateCustomerEnvironment;

public sealed class CreateCustomerEnvironmentCommandHandler(
    IEnvironmentRepository envRepository,
    ICustomerRepository customerRepository,
    IUnitOfWork unitOfWork,
    ILocalizer localizer) : IRequestHandler<CreateCustomerEnvironmentCommand, Guid>
{
    public async Task<Guid> Handle(CreateCustomerEnvironmentCommand request, CancellationToken ct)
    {
        var customerProduct = await customerRepository.GetCustomerProductByIdAsync(request.CustomerProductId, ct)
            ?? throw new NotFoundException("CustomerProduct", request.CustomerProductId);

        var envType = await envRepository.GetEnvironmentTypeByIdAsync(request.EnvironmentTypeId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.EnvironmentType), request.EnvironmentTypeId);

        if (!envType.IsActive)
            throw new DomainException(localizer.Get("err.environmentType.notActive", envType.Name));

        var environment = new CustomerEnvironment
        {
            CustomerProductId = customerProduct.Id,
            EnvironmentTypeId = envType.Id,
            HostingPlatformId = request.HostingPlatformId,
            Name = string.IsNullOrWhiteSpace(request.Name) ? envType.Name : request.Name,
            Notes = request.Notes
        };

        await envRepository.AddCustomerEnvironmentAsync(environment, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return environment.Id;
    }
}
