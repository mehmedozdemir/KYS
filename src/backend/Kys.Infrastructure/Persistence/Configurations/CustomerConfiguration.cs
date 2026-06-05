using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Code).IsRequired().HasMaxLength(50);
        builder.Property(x => x.ShortName).HasMaxLength(100);
        builder.Property(x => x.Sector).HasMaxLength(100);
        builder.Property(x => x.Country).HasMaxLength(100);
        builder.Property(x => x.City).HasMaxLength(100);
        builder.Property(x => x.ChurnReason).HasMaxLength(1000);
        builder.Property(x => x.PrimaryContactName).HasMaxLength(150);
        builder.Property(x => x.PrimaryContactEmail).HasMaxLength(255);
        builder.Property(x => x.PrimaryContactPhone).HasMaxLength(50);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(x => x.CustomFields)
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'{}'");

        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => new { x.Status, x.IsArchived, x.IsDeleted });

        builder.HasMany(x => x.Products)
            .WithOne(x => x.Customer)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
