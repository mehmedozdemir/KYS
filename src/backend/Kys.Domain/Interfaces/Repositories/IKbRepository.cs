using Kys.Domain.Entities;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Interfaces.Repositories;

public interface IKbRepository
{
    Task<(IReadOnlyList<KbArticle> Items, int TotalCount)> GetArticlesAsync(
        string? search, Guid? productId, Guid? customerId, Guid? teamId,
        string? tag, int page, int pageSize, CancellationToken ct = default);

    Task<KbArticle?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(KbArticle article, CancellationToken ct = default);
    void Update(KbArticle article);
    void Delete(KbArticle article);

    Task<IReadOnlyList<KbTag>> GetTagsAsync(CancellationToken ct = default);
    Task<KbTag?> GetTagBySlugAsync(string slug, CancellationToken ct = default);
    Task AddTagAsync(KbTag tag, CancellationToken ct = default);
}
