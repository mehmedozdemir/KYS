using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class ResourceTypeConfiguration : IEntityTypeConfiguration<ResourceType>
{
    public void Configure(EntityTypeBuilder<ResourceType> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Code).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Category).HasMaxLength(50);
        builder.Property(x => x.Icon).HasMaxLength(50);

        builder.Property(x => x.FieldSchema)
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'{}'");

        builder.HasIndex(x => x.Code).IsUnique();
    }
}
