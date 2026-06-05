using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

public sealed class KbArticle : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;  // Markdown
    public KbVisibility Visibility { get; set; } = KbVisibility.Internal;

    // Optional context links
    public Guid? ProductId { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? TeamId { get; set; }

    // Navigation
    public Product? Product { get; set; }
    public Customer? Customer { get; set; }
    public Team? Team { get; set; }
    public ICollection<KbArticleTag> ArticleTags { get; set; } = [];
}
