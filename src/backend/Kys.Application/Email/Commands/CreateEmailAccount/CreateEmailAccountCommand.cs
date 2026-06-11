using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Email.Commands.CreateEmailAccount;

public sealed record CreateEmailAccountCommand(
    string Name,
    EmailProvider Provider,
    string Host,
    int Port,
    EmailSecurity Security,
    string Username,
    string Password,
    string FromAddress,
    string? FromName,
    bool AcceptAllCertificates,
    bool MakeActive) : IRequest<Guid>;
