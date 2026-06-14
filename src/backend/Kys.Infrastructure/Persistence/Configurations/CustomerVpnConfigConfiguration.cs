using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class CustomerVpnConfigConfiguration : IEntityTypeConfiguration<CustomerVpnConfig>
{
    public void Configure(EntityTypeBuilder<CustomerVpnConfig> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(150);
        builder.Property(x => x.ServerHost).IsRequired().HasMaxLength(255);
        builder.Property(x => x.Username).HasMaxLength(255);
        builder.Property(x => x.PasswordIv).HasMaxLength(100);
        builder.Property(x => x.VpnType).HasConversion<string>().HasMaxLength(30);

        builder.HasOne(x => x.Customer)
            .WithMany(x => x.VpnConfigs)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne(x => x.CustomerEnvironment)
            .WithMany()
            .HasForeignKey(x => x.CustomerEnvironmentId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasIndex(x => x.CustomerId);
    }
}
