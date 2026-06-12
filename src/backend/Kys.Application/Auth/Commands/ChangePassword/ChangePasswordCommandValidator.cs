using FluentValidation;

namespace Kys.Application.Auth.Commands.ChangePassword;

public sealed class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8).WithMessage("val.password.minLength");
        RuleFor(x => x.NewPassword).NotEqual(x => x.CurrentPassword).WithMessage("val.password.mustDiffer");
    }
}
