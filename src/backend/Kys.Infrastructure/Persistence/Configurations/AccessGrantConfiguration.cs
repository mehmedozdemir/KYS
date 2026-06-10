using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class AccessGrantConfiguration : IEntityTypeConfiguration<AccessGrant>
{
    public void Configure(EntityTypeBuilder<AccessGrant> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Kind).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.ScopeType).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Level).HasConversion<string>().HasMaxLength(10);
        builder.Property(x => x.Capability).HasMaxLength(50);

        builder.HasOne(x => x.Person)
            .WithMany()
            .HasForeignKey(x => x.PersonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.PersonId, x.Kind });
        builder.HasIndex(x => new { x.ScopeType, x.ScopeId });
    }
}
