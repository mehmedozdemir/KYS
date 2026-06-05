using FluentValidation;

namespace Kys.Application.KnowledgeBase.Commands.CreateArticle;

public sealed class CreateArticleCommandValidator : AbstractValidator<CreateArticleCommand>
{
    public CreateArticleCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Content).NotEmpty();
        RuleFor(x => x.Tags).Must(t => t.Count <= 10).WithMessage("Maximum 10 tags allowed.");
    }
}
