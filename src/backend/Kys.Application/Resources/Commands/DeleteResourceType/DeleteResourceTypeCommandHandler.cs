using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Resources.Commands.DeleteResourceType;

public sealed class DeleteResourceTypeCommandHandler(
    IResourceRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteResourceTypeCommand>
{
    public async Task Handle(DeleteResourceTypeCommand request, CancellationToken ct)
    {
        var resourceType = await repository.GetResourceTypeByIdAsync(request.Id, ct)
            ?? throw new KeyNotFoundException($"ResourceType {request.Id} not found.");

        resourceType.IsActive = false;
        repository.UpdateResourceType(resourceType);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
