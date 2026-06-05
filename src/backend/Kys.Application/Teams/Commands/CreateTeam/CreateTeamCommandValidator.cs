using FluentValidation;

namespace Kys.Application.Teams.Commands.CreateTeam;

public sealed class CreateTeamCommandValidator : AbstractValidator<CreateTeamCommand>
{
    private static readonly string[] ValidTypes = ["Domain", "Project", "Platform"];

    public CreateTeamCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000).When(x => x.Description is not null);
        RuleFor(x => x.TeamType).NotEmpty().Must(t => ValidTypes.Contains(t))
            .WithMessage("TeamType must be Domain, Project, or Platform.");
    }
}
