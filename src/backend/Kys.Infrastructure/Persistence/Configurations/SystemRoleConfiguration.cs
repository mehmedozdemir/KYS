using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class SystemRoleConfiguration : IEntityTypeConfiguration<SystemRole>
{
    public void Configure(EntityTypeBuilder<SystemRole> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Name).HasMaxLength(100).IsRequired();
        builder.Property(r => r.Code).HasMaxLength(50).IsRequired();
        builder.Property(r => r.Description).HasMaxLength(500);

        builder.Property(r => r.Permissions)
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'[]'");

        builder.HasIndex(r => r.Code).IsUnique();

        builder.HasData(
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "Platform Yöneticisi",
                Code = SystemRole.Codes.PlatformAdmin,
                Description = "Tüm sistem yetkilerine sahip",
                Permissions = ["*"],
                IsSystem = true
            },
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Name = "Direktör",
                Code = SystemRole.Codes.Director,
                Description = "Okuma ve raporlama yetkileri",
                Permissions = ["read:*", "report:*"],
                IsSystem = true
            },
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Name = "Ekip Lideri",
                Code = SystemRole.Codes.TeamLead,
                Description = "Ekip yönetimi ve kaynak düzenleme",
                Permissions = ["read:*", "write:teams", "write:resources", "write:people.team"],
                IsSystem = true
            },
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
                Name = "Geliştirici",
                Code = SystemRole.Codes.Developer,
                Description = "Atandığı ürün ve müşteri kayıtlarını görme",
                Permissions = ["read:assigned"],
                IsSystem = true
            },
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000005"),
                Name = "Salt Okuma",
                Code = SystemRole.Codes.ReadOnly,
                Description = "Sadece genel listeleri okuma",
                Permissions = ["read:lists"],
                IsSystem = true
            }
        );
    }
}
