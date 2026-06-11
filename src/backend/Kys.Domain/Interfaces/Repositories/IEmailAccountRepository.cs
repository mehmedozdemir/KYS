using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface IEmailAccountRepository
{
    Task<IReadOnlyList<EmailAccount>> GetAllAsync(CancellationToken ct = default);
    Task<EmailAccount?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<EmailAccount?> GetActiveAsync(CancellationToken ct = default);
    Task AddAsync(EmailAccount account, CancellationToken ct = default);
    void Update(EmailAccount account);
    void Delete(EmailAccount account);
    /// <summary>Verilen hesap dışındaki tüm hesapların IsActive bayrağını kaldırır.</summary>
    Task DeactivateOthersAsync(Guid keepId, CancellationToken ct = default);
}
