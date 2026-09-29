using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class EndpointHealthConfiguration : IEntityTypeConfiguration<EndpointHealth>
{
    public void Configure(EntityTypeBuilder<EndpointHealth> builder)
    {
        builder.HasKey(x => x.CustomerEnvironmentEndpointId);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Error).HasMaxLength(200);

        builder.HasOne(x => x.Endpoint)
            .WithMany()
            .HasForeignKey(x => x.CustomerEnvironmentEndpointId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
