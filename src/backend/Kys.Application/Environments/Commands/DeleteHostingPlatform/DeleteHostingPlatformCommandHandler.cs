using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.DeleteHostingPlatform;

public sealed class DeleteHostingPlatformCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteHostingPlatformCommand>
{
    public async Task Handle(DeleteHostingPlatformCommand request, CancellationToken ct)
    {
        var platform = await repository.GetHostingPlatformByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.HostingPlatform), request.Id);

        var usageCount = await repository.CountEnvironmentsByPlatformAsync(request.Id, ct);
        if (usageCount > 0)
            throw new ConflictException($"Bu platforma bağlı {usageCount} ortam var. Önce ortamların platformunu değiştirin.");

        repository.DeleteHostingPlatform(platform);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
