using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class OrganizationProfileConfiguration : IEntityTypeConfiguration<OrganizationProfile>
{
    public void Configure(EntityTypeBuilder<OrganizationProfile> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CompanyName).IsRequired().HasMaxLength(200);
        builder.Property(x => x.ShortName).HasMaxLength(100);
        builder.Property(x => x.Website).HasMaxLength(300);
        builder.Property(x => x.Slogan).HasMaxLength(300);
        builder.Property(x => x.ContactEmail).HasMaxLength(200);
        builder.Property(x => x.ContactPhone).HasMaxLength(50);
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.TaxNumber).HasMaxLength(50);
        builder.Property(x => x.LogoContentType).HasMaxLength(100);

        // Tekil varsayılan kayıt
        builder.HasData(new OrganizationProfile
        {
            Id = OrganizationProfile.SingletonId,
            CompanyName = "KYS"
        });
    }
}
