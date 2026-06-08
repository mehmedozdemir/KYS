using MediatR;

namespace Kys.Application.Credentials.Commands.DeleteCredential;

public sealed record DeleteCredentialCommand(Guid CredentialId) : IRequest;
