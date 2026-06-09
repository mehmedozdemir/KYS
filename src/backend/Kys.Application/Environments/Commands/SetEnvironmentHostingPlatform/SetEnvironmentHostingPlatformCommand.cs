using MediatR;

namespace Kys.Application.Environments.Commands.SetEnvironmentHostingPlatform;

public sealed record SetEnvironmentHostingPlatformCommand(
    Guid EnvironmentId,
    Guid? HostingPlatformId) : IRequest;
