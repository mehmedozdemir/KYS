using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Email.Commands.UpdateEmailAccount;

public sealed record UpdateEmailAccountCommand(
    Guid Id,
    string Name,
    EmailProvider Provider,
    string Host,
    int Port,
    EmailSecurity Security,
    string Username,
    string? Password, // null = mevcut parolayı koru
    string FromAddress,
    string? FromName,
    bool AcceptAllCertificates) : IRequest;
