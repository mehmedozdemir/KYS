using FluentValidation;

namespace Kys.Application.Resources.Commands.CreateResourceType;

public sealed class CreateResourceTypeCommandValidator : AbstractValidator<CreateResourceTypeCommand>
{
    public CreateResourceTypeCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Category).MaximumLength(50);
    }
}
