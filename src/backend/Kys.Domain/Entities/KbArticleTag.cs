namespace Kys.Domain.Entities;

public sealed class KbArticleTag
{
    public Guid KbArticleId { get; set; }
    public Guid KbTagId { get; set; }

    // Navigation
    public KbArticle KbArticle { get; set; } = null!;
    public KbTag KbTag { get; set; } = null!;
}
