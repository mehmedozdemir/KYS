using FluentValidation;

namespace Kys.Application.Environments.Commands.AddResourceToEnvironment;

public sealed class AddResourceToEnvironmentCommandValidator : AbstractValidator<AddResourceToEnvironmentCommand>
{
    public AddResourceToEnvironmentCommandValidator()
    {
        RuleFor(x => x.CustomerEnvironmentId).NotEmpty();
        RuleFor(x => x.ProductResourceTemplateId).NotEmpty();
        RuleFor(x => x.Notes).MaximumLength(1000);
        RuleFor(x => x.SharedResourceId)
            .NotEmpty()
            .When(x => x.IsShared)
            .WithMessage("val.resource.sharedRequired");
    }
}
