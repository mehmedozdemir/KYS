using FluentValidation;

namespace Kys.Application.Environments.Commands.CreateHostingPlatform;

public sealed class CreateHostingPlatformCommandValidator : AbstractValidator<CreateHostingPlatformCommand>
{
    public CreateHostingPlatformCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(30);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Category).MaximumLength(50);
        RuleFor(x => x.Icon).MaximumLength(50);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
