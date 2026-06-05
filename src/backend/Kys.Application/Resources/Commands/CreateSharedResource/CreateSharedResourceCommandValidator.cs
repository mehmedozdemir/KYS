using FluentValidation;

namespace Kys.Application.Resources.Commands.CreateSharedResource;

public sealed class CreateSharedResourceCommandValidator : AbstractValidator<CreateSharedResourceCommand>
{
    public CreateSharedResourceCommandValidator()
    {
        RuleFor(x => x.ResourceTypeId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.EnvironmentScope)
            .Must(v => v == null || new[] { "Dev", "Test", "Prod", "All" }.Contains(v))
            .WithMessage("EnvironmentScope must be one of: Dev, Test, Prod, All.");
    }
}
