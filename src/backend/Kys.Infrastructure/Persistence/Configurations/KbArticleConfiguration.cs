using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class KbArticleConfiguration : IEntityTypeConfiguration<KbArticle>
{
    public void Configure(EntityTypeBuilder<KbArticle> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(300);
        builder.Property(x => x.Content).IsRequired();

        builder.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.SetNull).IsRequired(false);
        builder.HasOne(x => x.Customer).WithMany().HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.SetNull).IsRequired(false);
        builder.HasOne(x => x.Team).WithMany().HasForeignKey(x => x.TeamId)
            .OnDelete(DeleteBehavior.SetNull).IsRequired(false);

        builder.HasIndex(x => x.Title);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
