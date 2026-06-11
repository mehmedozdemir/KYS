using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class OrganizationProfileRepository(AppDbContext db) : IOrganizationProfileRepository
{
    public async Task<OrganizationProfile> GetAsync(CancellationToken ct = default)
    {
        var profile = await db.OrganizationProfiles.FirstOrDefaultAsync(ct);
        if (profile is null)
        {
            // Seed yoksa güvenli varsayılan oluştur
            profile = new OrganizationProfile { Id = OrganizationProfile.SingletonId, CompanyName = "KYS" };
            await db.OrganizationProfiles.AddAsync(profile, ct);
        }
        return profile;
    }

    public void Update(OrganizationProfile profile) => db.OrganizationProfiles.Update(profile);
}
