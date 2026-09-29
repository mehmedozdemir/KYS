using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Commands.UpdateTeam;

public sealed class UpdateTeamCommandHandler(
    ITeamRepository teamRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateTeamCommand>
{
    public async Task Handle(UpdateTeamCommand request, CancellationToken cancellationToken)
    {
        var team = await teamRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Team), request.Id);

        team.Name = request.Name.Trim();
        team.Code = string.IsNullOrWhiteSpace(request.Code) ? null : request.Code.Trim().ToUpperInvariant();
        team.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        team.TeamType = request.TeamType;

        teamRepository.Update(team);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
