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
                Description = "Sistem/teknik yönetici — tüm yetkiler",
                Permissions = ["*"],
                IsSystem = true
            },
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Name = "Direktör",
                Code = SystemRole.Codes.Director,
                Description = "En üst iş otoritesi — tüm yetkiler",
                Permissions = ["*"],
                IsSystem = true
            },
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Name = "Ekip Lideri",
                Code = SystemRole.Codes.TeamLead,
                Description = "Kendi ekibinin ürünlerini yönetir (müşteri oluşturamaz)",
                Permissions = ["customer:read", "product:*", "environment:*", "credential:*", "team:*", "person:read", "kb:*"],
                IsSystem = true
            },
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
                Name = "Geliştirici",
                Code = SystemRole.Codes.Developer,
                Description = "Kendi çalıştığı ürünleri görür; yazma yetki (grant) ile",
                Permissions = ["customer:read", "product:read", "environment:read", "credential:view", "team:read", "person:read", "kb:read", "kb:write"],
                IsSystem = true
            },
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000005"),
                Name = "Salt Okuma",
                Code = SystemRole.Codes.ReadOnly,
                Description = "Atandığı kapsamda salt okuma",
                Permissions = ["customer:read", "product:read", "team:read", "person:read", "environment:read", "kb:read"],
                IsSystem = true
            },
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000006"),
                Name = "Ürün Sahibi (PO)",
                Code = SystemRole.Codes.ProductOwner,
                Description = "Müşteri/ürün oluşturur; sahibi olduğu ürünün tüm verisini yönetir",
                Permissions = ["customer:*", "product:*", "environment:*", "credential:*", "team:read", "team:write", "team:member", "person:read", "kb:*"],
                IsSystem = true
            },
            new SystemRole
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000007"),
                Name = "CTO",
                Code = SystemRole.Codes.CTO,
                Description = "Gözlemci — tüm sistemi salt okur",
                Permissions = ["scope:global", "customer:read", "product:read", "team:read", "person:read", "environment:read", "kb:read", "admin:audit"],
                IsSystem = true
            }
        );
    }
}
