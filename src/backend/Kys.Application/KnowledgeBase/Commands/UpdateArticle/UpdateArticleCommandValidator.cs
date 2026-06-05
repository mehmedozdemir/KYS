using FluentValidation;

namespace Kys.Application.KnowledgeBase.Commands.UpdateArticle;

public sealed class UpdateArticleCommandValidator : AbstractValidator<UpdateArticleCommand>
{
    public UpdateArticleCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Content).NotEmpty();
        RuleFor(x => x.Tags).Must(t => t.Count <= 10).WithMessage("Maximum 10 tags allowed.");
    }
}
