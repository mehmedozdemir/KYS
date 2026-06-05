using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.KnowledgeBase.Commands.UpdateArticle;

public sealed record UpdateArticleCommand(
    Guid Id,
    string Title,
    string Content,
    KbVisibility Visibility,
    Guid? ProductId,
    Guid? CustomerId,
    Guid? TeamId,
    IReadOnlyList<string> Tags) : IRequest;
