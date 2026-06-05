using Kys.Domain.Entities.Base;

namespace Kys.Domain.Entities;

public sealed class KbTag : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;  // lowercase-kebab

    // Navigation
    public ICollection<KbArticleTag> ArticleTags { get; set; } = [];
}
