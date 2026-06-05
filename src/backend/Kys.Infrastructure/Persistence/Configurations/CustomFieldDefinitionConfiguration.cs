using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class CustomFieldDefinitionConfiguration : IEntityTypeConfiguration<CustomFieldDefinition>
{
    public void Configure(EntityTypeBuilder<CustomFieldDefinition> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.EntityType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.FieldKey).IsRequired().HasMaxLength(100);
        builder.Property(x => x.DisplayName).IsRequired().HasMaxLength(150);

        builder.Property(x => x.FieldType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.DefaultValue).HasMaxLength(500);
        builder.Property(x => x.GroupName).HasMaxLength(100);

        builder.Property(x => x.SelectOptions)
            .HasColumnType("jsonb");

        builder.Property(x => x.ValidationRules)
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'{}'");

        builder.HasIndex(x => new { x.EntityType, x.FieldKey }).IsUnique();
    }
}
