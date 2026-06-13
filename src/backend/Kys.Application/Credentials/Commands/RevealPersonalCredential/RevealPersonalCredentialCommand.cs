using MediatR;

namespace Kys.Application.Credentials.Commands.RevealPersonalCredential;

public sealed record RevealPersonalCredentialCommand(Guid CredentialId) : IRequest<string>;
