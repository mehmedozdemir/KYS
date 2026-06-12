using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Environments.Commands.DeleteHostingPlatform;

public sealed class DeleteHostingPlatformCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork,
    ILocalizer localizer) : IRequestHandler<DeleteHostingPlatformCommand>
{
    public async Task Handle(DeleteHostingPlatformCommand request, CancellationToken ct)
    {
        var platform = await repository.GetHostingPlatformByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.HostingPlatform), request.Id);

        var usageCount = await repository.CountEnvironmentsByPlatformAsync(request.Id, ct);
        if (usageCount > 0)
            throw new ConflictException(localizer.Get("err.hostingPlatform.inUse", usageCount));

        repository.DeleteHostingPlatform(platform);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
