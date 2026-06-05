using MediatR;

namespace Kys.Application.KnowledgeBase.Queries.GetArticleDetail;

public sealed record GetArticleDetailQuery(Guid Id) : IRequest<ArticleDetailDto?>;

public sealed record ArticleDetailDto(
    Guid Id,
    string Title,
    string Content,
    string Visibility,
    Guid? ProductId,
    string? ProductName,
    Guid? CustomerId,
    string? CustomerName,
    Guid? TeamId,
    string? TeamName,
    IReadOnlyList<string> Tags,
    DateTime CreatedAt,
    Guid? CreatedBy,
    DateTime UpdatedAt,
    Guid? UpdatedBy);
