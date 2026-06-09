using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.SetEnvironmentHostingPlatform;

public sealed class SetEnvironmentHostingPlatformCommandHandler(
    IEnvironmentRepository envRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<SetEnvironmentHostingPlatformCommand>
{
    public async Task Handle(SetEnvironmentHostingPlatformCommand request, CancellationToken ct)
    {
        var environment = await envRepository.GetEnvironmentByIdAsync(request.EnvironmentId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.CustomerEnvironment), request.EnvironmentId);

        if (request.HostingPlatformId.HasValue)
        {
            _ = await envRepository.GetHostingPlatformByIdAsync(request.HostingPlatformId.Value, ct)
                ?? throw new NotFoundException(nameof(Domain.Entities.HostingPlatform), request.HostingPlatformId.Value);
        }

        environment.HostingPlatformId = request.HostingPlatformId;
        await unitOfWork.SaveChangesAsync(ct);
    }
}
