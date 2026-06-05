using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Resources.Commands.CreateSharedResource;

public sealed class CreateSharedResourceCommandHandler(
    IResourceRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateSharedResourceCommand, Guid>
{
    public async Task<Guid> Handle(CreateSharedResourceCommand request, CancellationToken ct)
    {
        var resourceType = await repository.GetResourceTypeByIdAsync(request.ResourceTypeId, ct)
            ?? throw new DomainException($"ResourceType {request.ResourceTypeId} not found.");

        var sharedResource = new SharedResource
        {
            ResourceTypeId = resourceType.Id,
            Name = request.Name,
            Description = request.Description,
            EnvironmentScope = request.EnvironmentScope,
            ConnectionFields = request.ConnectionFields
        };

        await repository.AddSharedResourceAsync(sharedResource, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return sharedResource.Id;
    }
}
