using FluentValidation;

namespace Kys.Application.Environments.Commands.CreateEnvironmentType;

public sealed class CreateEnvironmentTypeCommandValidator : AbstractValidator<CreateEnvironmentTypeCommand>
{
    public CreateEnvironmentTypeCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(30).Matches("^[A-Z0-9_]+$").WithMessage("Code must be uppercase letters, digits, or underscores.");
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Color).Matches("^#[0-9A-Fa-f]{6}$").When(x => x.Color != null).WithMessage("Color must be a valid hex code (e.g. #FF0000).");
    }
}
