using MediatR;

namespace Kys.Application.KnowledgeBase.Queries.GetArticles;

public sealed record GetArticlesQuery(
    string? Search,
    Guid? ProductId,
    Guid? CustomerId,
    Guid? TeamId,
    string? Tag,
    int Page = 1,
    int PageSize = 20) : IRequest<ArticleListDto>;

public sealed record ArticleListDto(
    IReadOnlyList<ArticleSummaryDto> Items,
    int TotalCount,
    int Page,
    int PageSize);

public sealed record ArticleSummaryDto(
    Guid Id,
    string Title,
    string Visibility,
    Guid? ProductId,
    string? ProductName,
    Guid? CustomerId,
    string? CustomerName,
    Guid? TeamId,
    string? TeamName,
    IReadOnlyList<string> Tags,
    DateTime UpdatedAt,
    Guid? UpdatedBy);
