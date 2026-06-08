using MediatR;

namespace Kys.Application.Credentials.Commands.SetCredential;

public sealed record SetCredentialCommand(
    Guid? EnvironmentResourceId,
    Guid? SharedResourceId,
    Guid? EndpointUrlId,
    string FieldKey,
    string PlainValue) : IRequest<Guid>;
