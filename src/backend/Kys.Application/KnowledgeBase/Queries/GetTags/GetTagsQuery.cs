using MediatR;

namespace Kys.Application.KnowledgeBase.Queries.GetTags;

public sealed record GetTagsQuery : IRequest<IReadOnlyList<TagDto>>;

public sealed record TagDto(Guid Id, string Name, string Slug);
