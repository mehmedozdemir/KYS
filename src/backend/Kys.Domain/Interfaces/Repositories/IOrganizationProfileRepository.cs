using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface IOrganizationProfileRepository
{
    /// <summary>Tekil kurum profilini döner (izlenen — güncelleme için).</summary>
    Task<OrganizationProfile> GetAsync(CancellationToken ct = default);
    void Update(OrganizationProfile profile);
}
