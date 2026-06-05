using Asp.Versioning;
using Kys.Application.KnowledgeBase.Commands.CreateArticle;
using Kys.Application.KnowledgeBase.Commands.DeleteArticle;
using Kys.Application.KnowledgeBase.Commands.UpdateArticle;
using Kys.Application.KnowledgeBase.Queries.GetArticleDetail;
using Kys.Application.KnowledgeBase.Queries.GetArticles;
using Kys.Application.KnowledgeBase.Queries.GetTags;
using Kys.Domain.Enumerations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/knowledge-base")]
[Authorize]
public sealed class KnowledgeBaseController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetArticles(
        [FromQuery] string? search,
        [FromQuery] Guid? productId,
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? teamId,
        [FromQuery] string? tag,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await mediator.Send(
            new GetArticlesQuery(search, productId, customerId, teamId, tag, page, Math.Clamp(pageSize, 1, 100)), ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDetail(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetArticleDetailQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("tags")]
    public async Task<IActionResult> GetTags(CancellationToken ct)
        => Ok(await mediator.Send(new GetTagsQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create(CreateArticleRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateArticleCommand(
            request.Title,
            request.Content,
            request.Visibility,
            request.ProductId,
            request.CustomerId,
            request.TeamId,
            request.Tags), ct);
        return CreatedAtAction(nameof(GetDetail), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateArticleRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateArticleCommand(
            id,
            request.Title,
            request.Content,
            request.Visibility,
            request.ProductId,
            request.CustomerId,
            request.TeamId,
            request.Tags), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteArticleCommand(id), ct);
        return NoContent();
    }
}

public sealed record CreateArticleRequest(
    string Title,
    string Content,
    KbVisibility Visibility,
    Guid? ProductId,
    Guid? CustomerId,
    Guid? TeamId,
    IReadOnlyList<string> Tags);

public sealed record UpdateArticleRequest(
    string Title,
    string Content,
    KbVisibility Visibility,
    Guid? ProductId,
    Guid? CustomerId,
    Guid? TeamId,
    IReadOnlyList<string> Tags);
