using MediatR;

namespace Kys.Application.KnowledgeBase.Commands.DeleteArticle;

public sealed record DeleteArticleCommand(Guid Id) : IRequest;
