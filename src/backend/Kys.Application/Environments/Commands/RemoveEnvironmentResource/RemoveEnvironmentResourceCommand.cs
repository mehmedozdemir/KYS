using MediatR;

namespace Kys.Application.Environments.Commands.RemoveEnvironmentResource;

public sealed record RemoveEnvironmentResourceCommand(Guid ResourceId) : IRequest;
