using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Email.Queries.GetEmailAccounts;

public sealed class GetEmailAccountsQueryHandler(IEmailAccountRepository repository)
    : IRequestHandler<GetEmailAccountsQuery, IReadOnlyList<EmailAccountDto>>
{
    public async Task<IReadOnlyList<EmailAccountDto>> Handle(GetEmailAccountsQuery request, CancellationToken ct)
    {
        var accounts = await repository.GetAllAsync(ct);
        return accounts.Select(a => new EmailAccountDto(
            a.Id, a.Name, a.Provider, a.Host, a.Port, a.Security,
            a.Username, a.FromAddress, a.FromName, a.AcceptAllCertificates, a.IsActive)).ToList();
    }
}
