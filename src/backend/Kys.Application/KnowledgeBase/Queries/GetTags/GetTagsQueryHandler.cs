using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.KnowledgeBase.Queries.GetTags;

public sealed class GetTagsQueryHandler(IKbRepository repository)
    : IRequestHandler<GetTagsQuery, IReadOnlyList<TagDto>>
{
    public async Task<IReadOnlyList<TagDto>> Handle(GetTagsQuery request, CancellationToken ct)
    {
        var tags = await repository.GetTagsAsync(ct);
        return tags.Select(t => new TagDto(t.Id, t.Name, t.Slug)).ToList();
    }
}
