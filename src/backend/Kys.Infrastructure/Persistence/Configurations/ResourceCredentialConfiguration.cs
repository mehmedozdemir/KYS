using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class ResourceCredentialConfiguration : IEntityTypeConfiguration<ResourceCredential>
{
    public void Configure(EntityTypeBuilder<ResourceCredential> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FieldKey).IsRequired().HasMaxLength(100);
        builder.Property(x => x.EncryptedValue).IsRequired();
        builder.Property(x => x.Iv).IsRequired().HasMaxLength(100);

        builder.HasIndex(x => new { x.EnvironmentResourceId, x.FieldKey })
            .HasFilter("environment_resource_id IS NOT NULL")
            .IsUnique();

        builder.HasIndex(x => new { x.SharedResourceId, x.FieldKey })
            .HasFilter("shared_resource_id IS NOT NULL")
            .IsUnique();

        builder.HasOne(x => x.EnvironmentResource)
            .WithMany(x => x.Credentials)
            .HasForeignKey(x => x.EnvironmentResourceId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired(false);

        builder.HasOne(x => x.SharedResourceNav)
            .WithMany()
            .HasForeignKey(x => x.SharedResourceId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired(false);
    }
}
