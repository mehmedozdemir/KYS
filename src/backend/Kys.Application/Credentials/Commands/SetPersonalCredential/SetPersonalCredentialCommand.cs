using MediatR;

namespace Kys.Application.Credentials.Commands.SetPersonalCredential;

public sealed record SetPersonalCredentialCommand(
    Guid? EnvironmentResourceId,
    Guid? SharedResourceId,
    string FieldKey,
    string PlainValue) : IRequest<Guid>;
