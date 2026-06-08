using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Resources.Commands.UpdateResourceType;

public sealed class UpdateResourceTypeCommandHandler(
    IResourceRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateResourceTypeCommand>
{
    public async Task Handle(UpdateResourceTypeCommand request, CancellationToken ct)
    {
        var resourceType = await repository.GetResourceTypeByIdAsync(request.Id, ct)
            ?? throw new KeyNotFoundException($"ResourceType {request.Id} not found.");

        resourceType.Name = request.Name;
        resourceType.Category = request.Category;
        resourceType.Icon = request.Icon;
        resourceType.Description = request.Description;
        resourceType.IsActive = request.IsActive;
        if (request.FieldSchema is not null)
            resourceType.FieldSchema = request.FieldSchema;

        repository.UpdateResourceType(resourceType);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
