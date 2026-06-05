using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EntityType).IsRequired().HasMaxLength(100);
        builder.Property(x => x.EntityName).HasMaxLength(300);
        builder.Property(x => x.Action).IsRequired().HasMaxLength(50);
        builder.Property(x => x.IpAddress).HasMaxLength(45);

        builder.Property(x => x.OldValues)
            .HasColumnType("jsonb")
            .HasConversion(
                v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => v == null ? null : System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(v, (System.Text.Json.JsonSerializerOptions?)null));

        builder.Property(x => x.NewValues)
            .HasColumnType("jsonb")
            .HasConversion(
                v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => v == null ? null : System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(v, (System.Text.Json.JsonSerializerOptions?)null));

        builder.HasIndex(x => new { x.EntityType, x.EntityId });
        builder.HasIndex(x => x.ChangedAt);
        builder.HasIndex(x => x.ChangedBy);
    }
}
