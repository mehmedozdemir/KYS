using FluentValidation;

namespace Kys.Application.Credentials.Commands.SetPersonalCredential;

public sealed class SetPersonalCredentialCommandValidator : AbstractValidator<SetPersonalCredentialCommand>
{
    public SetPersonalCredentialCommandValidator()
    {
        RuleFor(x => x.FieldKey)
            .NotEmpty().WithMessage("val.personalCredential.fieldKeyRequired")
            .MaximumLength(100);

        RuleFor(x => x.PlainValue)
            .NotEmpty().WithMessage("val.personalCredential.valueRequired");

        RuleFor(x => x)
            .Must(x => x.EnvironmentResourceId.HasValue || x.SharedResourceId.HasValue)
            .WithName("ResourceId")
            .WithMessage("val.personalCredential.targetRequired");
    }
}
