using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class OrganizationRoleConfiguration : IEntityTypeConfiguration<OrganizationRole>
{
    public void Configure(EntityTypeBuilder<OrganizationRole> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Name).HasMaxLength(100).IsRequired();
        builder.Property(r => r.Description).HasMaxLength(500);

        builder.HasData(
            new OrganizationRole { Id = Guid.Parse("a0000000-0000-0000-0000-000000000001"), Name = "Backend Geliştirici" },
            new OrganizationRole { Id = Guid.Parse("a0000000-0000-0000-0000-000000000002"), Name = "Frontend Geliştirici" },
            new OrganizationRole { Id = Guid.Parse("a0000000-0000-0000-0000-000000000003"), Name = "Full Stack Geliştirici" },
            new OrganizationRole { Id = Guid.Parse("a0000000-0000-0000-0000-000000000004"), Name = "DevOps Mühendisi" },
            new OrganizationRole { Id = Guid.Parse("a0000000-0000-0000-0000-000000000005"), Name = "Scrum Master" },
            new OrganizationRole { Id = Guid.Parse("a0000000-0000-0000-0000-000000000006"), Name = "Ürün Sahibi" },
            new OrganizationRole { Id = Guid.Parse("a0000000-0000-0000-0000-000000000007"), Name = "QA Mühendisi" },
            new OrganizationRole { Id = Guid.Parse("a0000000-0000-0000-0000-000000000008"), Name = "Takım Lideri" }
        );
    }
}
