using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.AddResourceToEnvironment;

public sealed class AddResourceToEnvironmentCommandHandler(
    IEnvironmentRepository envRepository,
    IResourceRepository resourceRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<AddResourceToEnvironmentCommand, Guid>
{
    public async Task<Guid> Handle(AddResourceToEnvironmentCommand request, CancellationToken ct)
    {
        var env = await envRepository.GetEnvironmentByIdAsync(request.CustomerEnvironmentId, ct)
            ?? throw new NotFoundException("CustomerEnvironment", request.CustomerEnvironmentId);

        if (request.IsShared && request.SharedResourceId.HasValue)
        {
            var sharedResource = await resourceRepository.GetSharedResourceByIdAsync(request.SharedResourceId.Value, ct)
                ?? throw new NotFoundException("SharedResource", request.SharedResourceId);
            _ = sharedResource;
        }

        var resource = new EnvironmentResource
        {
            CustomerEnvironmentId = env.Id,
            ProductResourceTemplateId = request.ProductResourceTemplateId,
            IsShared = request.IsShared,
            SharedResourceId = request.SharedResourceId,
            ConnectionFields = request.ConnectionFields,
            Notes = request.Notes
        };

        await envRepository.AddEnvironmentResourceAsync(resource, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return resource.Id;
    }
}
