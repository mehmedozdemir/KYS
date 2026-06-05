using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class ProductTeamConfiguration : IEntityTypeConfiguration<ProductTeam>
{
    public void Configure(EntityTypeBuilder<ProductTeam> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Role).HasMaxLength(50);

        builder.HasIndex(x => new { x.ProductId, x.TeamId }).IsUnique();

        builder.HasOne(x => x.Team)
            .WithMany()
            .HasForeignKey(x => x.TeamId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
