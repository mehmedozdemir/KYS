using MediatR;

namespace Kys.Application.Environments.Commands.RemoveEnvironmentEndpointUrl;

public sealed record RemoveEnvironmentEndpointUrlCommand(
    Guid CustomerEnvironmentId,
    Guid ProductEndpointId) : IRequest;
