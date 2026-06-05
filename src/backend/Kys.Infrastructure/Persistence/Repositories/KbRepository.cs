using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class KbRepository(AppDbContext db) : IKbRepository
{
    public async Task<(IReadOnlyList<KbArticle> Items, int TotalCount)> GetArticlesAsync(
        string? search, Guid? productId, Guid? customerId, Guid? teamId,
        string? tag, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.KbArticles
            .Include(a => a.ArticleTags).ThenInclude(at => at.KbTag)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(a => EF.Functions.ILike(a.Title, $"%{search}%") ||
                                     EF.Functions.ILike(a.Content, $"%{search}%"));

        if (productId.HasValue)
            query = query.Where(a => a.ProductId == productId);

        if (customerId.HasValue)
            query = query.Where(a => a.CustomerId == customerId);

        if (teamId.HasValue)
            query = query.Where(a => a.TeamId == teamId);

        if (!string.IsNullOrWhiteSpace(tag))
            query = query.Where(a => a.ArticleTags.Any(at => at.KbTag.Slug == tag));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<KbArticle?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.KbArticles
            .Include(a => a.ArticleTags).ThenInclude(at => at.KbTag)
            .Include(a => a.Product)
            .Include(a => a.Customer)
            .Include(a => a.Team)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task AddAsync(KbArticle article, CancellationToken ct = default)
        => await db.KbArticles.AddAsync(article, ct);

    public void Update(KbArticle article)
        => db.KbArticles.Update(article);

    public void Delete(KbArticle article)
        => db.KbArticles.Remove(article);

    public async Task<IReadOnlyList<KbTag>> GetTagsAsync(CancellationToken ct = default)
        => await db.KbTags.OrderBy(t => t.Name).ToListAsync(ct);

    public async Task<KbTag?> GetTagBySlugAsync(string slug, CancellationToken ct = default)
        => await db.KbTags.FirstOrDefaultAsync(t => t.Slug == slug, ct);

    public async Task AddTagAsync(KbTag tag, CancellationToken ct = default)
        => await db.KbTags.AddAsync(tag, ct);
}
