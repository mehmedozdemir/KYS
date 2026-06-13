using MediatR;

namespace Kys.Application.Credentials.Commands.DeletePersonalCredential;

public sealed record DeletePersonalCredentialCommand(Guid CredentialId) : IRequest;
