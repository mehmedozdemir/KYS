using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Resources.Commands.CreateResourceType;

public sealed class CreateResourceTypeCommandHandler(
    IResourceRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateResourceTypeCommand, Guid>
{
    public async Task<Guid> Handle(CreateResourceTypeCommand request, CancellationToken ct)
    {
        var resourceType = new ResourceType
        {
            Name = request.Name,
            Code = request.Code.ToUpperInvariant(),
            Category = request.Category,
            Icon = request.Icon,
            Description = request.Description,
            FieldSchema = request.FieldSchema
        };

        await repository.AddResourceTypeAsync(resourceType, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return resourceType.Id;
    }
}
