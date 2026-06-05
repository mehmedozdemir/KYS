using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class EnvironmentResourceConfiguration : IEntityTypeConfiguration<EnvironmentResource>
{
    public void Configure(EntityTypeBuilder<EnvironmentResource> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Notes).HasMaxLength(1000);

        builder.Property(x => x.ConnectionFields)
            .HasColumnType("jsonb")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new());

        builder.HasOne(x => x.CustomerEnvironment)
            .WithMany(x => x.Resources)
            .HasForeignKey(x => x.CustomerEnvironmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ProductResourceTemplate)
            .WithMany()
            .HasForeignKey(x => x.ProductResourceTemplateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SharedResource)
            .WithMany()
            .HasForeignKey(x => x.SharedResourceId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
