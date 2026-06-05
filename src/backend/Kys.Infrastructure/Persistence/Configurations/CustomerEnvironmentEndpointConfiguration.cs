using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class CustomerEnvironmentEndpointConfiguration : IEntityTypeConfiguration<CustomerEnvironmentEndpoint>
{
    public void Configure(EntityTypeBuilder<CustomerEnvironmentEndpoint> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.BaseUrl).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.SwaggerUrl).HasMaxLength(1000);
        builder.Property(x => x.HealthCheckUrl).HasMaxLength(1000);
        builder.Property(x => x.Notes).HasMaxLength(1000);

        builder.Property(x => x.AuthConfig)
            .HasColumnType("jsonb")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new());

        builder.HasIndex(x => new { x.CustomerEnvironmentId, x.ProductEndpointId }).IsUnique();

        builder.HasOne(x => x.CustomerEnvironment)
            .WithMany(x => x.Endpoints)
            .HasForeignKey(x => x.CustomerEnvironmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ProductEndpoint)
            .WithMany()
            .HasForeignKey(x => x.ProductEndpointId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
