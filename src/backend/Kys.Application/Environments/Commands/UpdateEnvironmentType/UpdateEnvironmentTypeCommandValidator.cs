using FluentValidation;

namespace Kys.Application.Environments.Commands.UpdateEnvironmentType;

public sealed class UpdateEnvironmentTypeCommandValidator : AbstractValidator<UpdateEnvironmentTypeCommand>
{
    public UpdateEnvironmentTypeCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
