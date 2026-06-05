using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Environments.Commands.SetEnvironmentEndpointUrl;

public sealed record SetEnvironmentEndpointUrlCommand(
    Guid CustomerEnvironmentId,
    Guid ProductEndpointId,
    string BaseUrl,
    string? SwaggerUrl,
    string? HealthCheckUrl,
    AuthType? AuthType,
    Dictionary<string, object?> AuthConfig,
    string? Notes) : IRequest<Guid>;
