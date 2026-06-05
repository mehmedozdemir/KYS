using MediatR;

namespace Kys.Application.Credentials.Commands.RevealCredential;

public sealed record RevealCredentialCommand(Guid CredentialId) : IRequest<string>;
