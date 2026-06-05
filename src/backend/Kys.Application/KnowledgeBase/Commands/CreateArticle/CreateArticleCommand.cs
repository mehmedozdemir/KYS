using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.KnowledgeBase.Commands.CreateArticle;

public sealed record CreateArticleCommand(
    string Title,
    string Content,
    KbVisibility Visibility,
    Guid? ProductId,
    Guid? CustomerId,
    Guid? TeamId,
    IReadOnlyList<string> Tags) : IRequest<Guid>;
