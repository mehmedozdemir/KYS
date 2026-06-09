using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Commands.DeleteTeam;

public sealed class DeleteTeamCommandHandler(
    ITeamRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteTeamCommand>
{
    public async Task Handle(DeleteTeamCommand request, CancellationToken ct)
    {
        var team = await repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("Team", request.Id);

        team.IsDeleted = true;
        team.DeletedAt = DateTime.UtcNow;

        repository.Update(team);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
