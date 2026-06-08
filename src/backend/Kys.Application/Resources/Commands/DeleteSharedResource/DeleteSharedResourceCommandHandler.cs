using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Resources.Commands.DeleteSharedResource;

public sealed class DeleteSharedResourceCommandHandler(
    IResourceRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteSharedResourceCommand>
{
    public async Task Handle(DeleteSharedResourceCommand request, CancellationToken ct)
    {
        var resource = await repository.GetSharedResourceByIdAsync(request.Id, ct)
            ?? throw new KeyNotFoundException($"SharedResource {request.Id} not found.");

        resource.IsDeleted = true;
        resource.DeletedAt = DateTime.UtcNow;

        repository.UpdateSharedResource(resource);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
