using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class EmailAccountRepository(AppDbContext db) : IEmailAccountRepository
{
    public async Task<IReadOnlyList<EmailAccount>> GetAllAsync(CancellationToken ct = default)
        => await db.EmailAccounts.AsNoTracking().OrderByDescending(a => a.IsActive).ThenBy(a => a.Name).ToListAsync(ct);

    public async Task<EmailAccount?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.EmailAccounts.FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<EmailAccount?> GetActiveAsync(CancellationToken ct = default)
        => await db.EmailAccounts.AsNoTracking().FirstOrDefaultAsync(a => a.IsActive, ct);

    public async Task AddAsync(EmailAccount account, CancellationToken ct = default)
        => await db.EmailAccounts.AddAsync(account, ct);

    public void Update(EmailAccount account) => db.EmailAccounts.Update(account);

    public void Delete(EmailAccount account) => db.EmailAccounts.Remove(account);

    public async Task DeactivateOthersAsync(Guid keepId, CancellationToken ct = default)
    {
        var others = await db.EmailAccounts.Where(a => a.IsActive && a.Id != keepId).ToListAsync(ct);
        foreach (var a in others) a.IsActive = false;
    }
}
