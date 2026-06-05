using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class ProductAssignmentConfiguration : IEntityTypeConfiguration<ProductAssignment>
{
    public void Configure(EntityTypeBuilder<ProductAssignment> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Responsibility).HasMaxLength(500);

        // Partial unique: only one active assignment per person per product
        builder.HasIndex(x => new { x.ProductId, x.PersonId })
            .IsUnique()
            .HasFilter("is_active = true");

        builder.HasOne(x => x.Person)
            .WithMany()
            .HasForeignKey(x => x.PersonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
