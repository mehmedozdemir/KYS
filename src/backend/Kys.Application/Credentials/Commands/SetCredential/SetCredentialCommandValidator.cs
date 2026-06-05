using FluentValidation;

namespace Kys.Application.Credentials.Commands.SetCredential;

public sealed class SetCredentialCommandValidator : AbstractValidator<SetCredentialCommand>
{
    public SetCredentialCommandValidator()
    {
        RuleFor(x => x.FieldKey).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PlainValue).NotEmpty();
        RuleFor(x => x)
            .Must(x => x.EnvironmentResourceId.HasValue || x.SharedResourceId.HasValue)
            .WithName("ResourceId")
            .WithMessage("Either EnvironmentResourceId or SharedResourceId must be provided.");
    }
}
