using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class ProductEndpointConfiguration : IEntityTypeConfiguration<ProductEndpoint>
{
    public void Configure(EntityTypeBuilder<ProductEndpoint> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(150);
        builder.Property(x => x.DefaultBaseUrl).HasMaxLength(500);
        builder.Property(x => x.SwaggerUrl).HasMaxLength(500);
        builder.Property(x => x.HealthCheckUrl).HasMaxLength(500);

        builder.Property(x => x.EndpointType)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(x => x.DefaultAuthType)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(x => x.AuthConfigTemplate)
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'{}'");
    }
}
