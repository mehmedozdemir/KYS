using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Code).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Version).HasMaxLength(30);
        builder.Property(x => x.RepositoryUrl).HasMaxLength(500);
        builder.Property(x => x.DocumentationUrl).HasMaxLength(500);

        builder.Property(x => x.ProductType)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(x => x.TechStack)
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'[]'");

        builder.Property(x => x.CustomFields)
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'{}'");

        builder.HasIndex(x => x.Code).IsUnique();

        builder.HasOne(x => x.PoPerson)
            .WithMany()
            .HasForeignKey(x => x.PoPersonId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.Teams)
            .WithOne(x => x.Product)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Assignments)
            .WithOne(x => x.Product)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Endpoints)
            .WithOne(x => x.Product)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.ResourceTemplates)
            .WithOne(x => x.Product)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
