using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Commands.CreateTeam;

public sealed class CreateTeamCommandHandler(
    ITeamRepository teamRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateTeamCommand, Guid>
{
    public async Task<Guid> Handle(CreateTeamCommand request, CancellationToken cancellationToken)
    {
        var team = new Team
        {
            Name = request.Name,
            Code = request.Code?.ToUpperInvariant(),
            Description = request.Description,
            TeamType = request.TeamType
        };

        await teamRepository.AddAsync(team, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return team.Id;
    }
}
