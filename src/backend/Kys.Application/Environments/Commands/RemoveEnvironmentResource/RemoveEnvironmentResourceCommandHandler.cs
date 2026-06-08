using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.RemoveEnvironmentResource;

public sealed class RemoveEnvironmentResourceCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<RemoveEnvironmentResourceCommand>
{
    public async Task Handle(RemoveEnvironmentResourceCommand request, CancellationToken ct)
    {
        var resource = await repository.GetResourceByIdAsync(request.ResourceId, ct)
            ?? throw new KeyNotFoundException($"EnvironmentResource {request.ResourceId} not found.");

        resource.IsActive = false;
        resource.DeletedAt = DateTime.UtcNow;
        resource.IsDeleted = true;
        repository.UpdateEnvironmentResource(resource);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
