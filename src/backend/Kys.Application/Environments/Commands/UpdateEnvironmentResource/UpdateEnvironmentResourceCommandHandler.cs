using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.UpdateEnvironmentResource;

public sealed class UpdateEnvironmentResourceCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateEnvironmentResourceCommand>
{
    public async Task Handle(UpdateEnvironmentResourceCommand request, CancellationToken ct)
    {
        var resource = await repository.GetResourceByIdAsync(request.ResourceId, ct)
            ?? throw new NotFoundException("EnvironmentResource", request.ResourceId);

        // Boş değerleri saklama: alan temizlendiyse sözlükten çıkar.
        resource.ConnectionFields = request.ConnectionFields
            .Where(kv => kv.Value is not null && !(kv.Value is string s && string.IsNullOrWhiteSpace(s)))
            .ToDictionary(kv => kv.Key, kv => kv.Value);
        resource.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        repository.UpdateEnvironmentResource(resource);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
