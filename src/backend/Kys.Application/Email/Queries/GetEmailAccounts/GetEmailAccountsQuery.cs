using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Email.Queries.GetEmailAccounts;

public sealed record GetEmailAccountsQuery : IRequest<IReadOnlyList<EmailAccountDto>>;

// Parola DTO'da yer almaz
public sealed record EmailAccountDto(
    Guid Id,
    string Name,
    EmailProvider Provider,
    string Host,
    int Port,
    EmailSecurity Security,
    string Username,
    string FromAddress,
    string? FromName,
    bool IsActive);
