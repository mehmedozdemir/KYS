using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class EnvironmentTypeConfiguration : IEntityTypeConfiguration<EnvironmentType>
{
    public void Configure(EntityTypeBuilder<EnvironmentType> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Code).IsRequired().HasMaxLength(30);
        builder.Property(x => x.Color).HasMaxLength(7);
        builder.HasIndex(x => x.Code).IsUnique();

        builder.HasData(
            new EnvironmentType { Id = new Guid("10000000-0000-0000-0000-000000000001"), Name = "Development", Code = "DEV", SortOrder = 1, Color = "#6366F1", IsActive = true },
            new EnvironmentType { Id = new Guid("10000000-0000-0000-0000-000000000002"), Name = "Test", Code = "TEST", SortOrder = 2, Color = "#F59E0B", IsActive = true },
            new EnvironmentType { Id = new Guid("10000000-0000-0000-0000-000000000003"), Name = "UAT", Code = "UAT", SortOrder = 3, Color = "#8B5CF6", IsActive = true },
            new EnvironmentType { Id = new Guid("10000000-0000-0000-0000-000000000004"), Name = "Production", Code = "PROD", SortOrder = 4, Color = "#EF4444", IsActive = true }
        );
    }
}
