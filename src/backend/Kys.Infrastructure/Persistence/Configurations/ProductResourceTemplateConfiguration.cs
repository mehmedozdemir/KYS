using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class ProductResourceTemplateConfiguration : IEntityTypeConfiguration<ProductResourceTemplate>
{
    public void Configure(EntityTypeBuilder<ProductResourceTemplate> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(150);
        builder.Property(x => x.Description).HasMaxLength(500);

        builder.HasOne(x => x.ResourceType)
            .WithMany()
            .HasForeignKey(x => x.ResourceTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
