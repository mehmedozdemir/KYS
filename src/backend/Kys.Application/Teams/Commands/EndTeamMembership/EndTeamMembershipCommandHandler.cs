using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Commands.EndTeamMembership;

public sealed class EndTeamMembershipCommandHandler(
    ITeamMembershipRepository membershipRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<EndTeamMembershipCommand>
{
    public async Task Handle(EndTeamMembershipCommand request, CancellationToken cancellationToken)
    {
        var membership = await membershipRepository.GetActiveAsync(request.PersonId, request.TeamId, cancellationToken)
            ?? throw new NotFoundException("TeamMembership", $"Person {request.PersonId} in Team {request.TeamId}");

        membership.End(request.EndDate);
        membershipRepository.Update(membership);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
