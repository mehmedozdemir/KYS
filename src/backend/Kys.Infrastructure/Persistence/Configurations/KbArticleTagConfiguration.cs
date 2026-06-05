using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class KbArticleTagConfiguration : IEntityTypeConfiguration<KbArticleTag>
{
    public void Configure(EntityTypeBuilder<KbArticleTag> builder)
    {
        builder.HasKey(x => new { x.KbArticleId, x.KbTagId });

        builder.HasOne(x => x.KbArticle).WithMany(x => x.ArticleTags)
            .HasForeignKey(x => x.KbArticleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.KbTag).WithMany(x => x.ArticleTags)
            .HasForeignKey(x => x.KbTagId).OnDelete(DeleteBehavior.Cascade);
    }
}
