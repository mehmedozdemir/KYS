using MediatR;

namespace Kys.Application.Environments.Commands.DeleteHostingPlatform;

public sealed record DeleteHostingPlatformCommand(Guid Id) : IRequest;
