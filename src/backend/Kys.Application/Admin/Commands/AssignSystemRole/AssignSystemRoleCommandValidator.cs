using FluentValidation;

namespace Kys.Application.Admin.Commands.AssignSystemRole;

public sealed class AssignSystemRoleCommandValidator : AbstractValidator<AssignSystemRoleCommand>
{
    public AssignSystemRoleCommandValidator()
    {
        RuleFor(x => x.PersonId).NotEmpty();
        RuleFor(x => x.SystemRoleId).NotEmpty();
    }
}
