using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Resources.Commands.UpdateSharedResource;

public sealed class UpdateSharedResourceCommandHandler(
    IResourceRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateSharedResourceCommand>
{
    public async Task Handle(UpdateSharedResourceCommand request, CancellationToken ct)
    {
        var resource = await repository.GetSharedResourceByIdAsync(request.Id, ct)
            ?? throw new KeyNotFoundException($"SharedResource {request.Id} not found.");

        resource.Name = request.Name;
        resource.Description = request.Description;
        resource.EnvironmentScope = request.EnvironmentScope;
        resource.ConnectionFields = request.ConnectionFields;

        repository.UpdateSharedResource(resource);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
