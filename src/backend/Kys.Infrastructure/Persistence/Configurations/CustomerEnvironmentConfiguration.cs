using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class CustomerEnvironmentConfiguration : IEntityTypeConfiguration<CustomerEnvironment>
{
    public void Configure(EntityTypeBuilder<CustomerEnvironment> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Notes).HasMaxLength(1000);

        builder.HasOne(x => x.CustomerProduct)
            .WithMany()
            .HasForeignKey(x => x.CustomerProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.EnvironmentType)
            .WithMany()
            .HasForeignKey(x => x.EnvironmentTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
