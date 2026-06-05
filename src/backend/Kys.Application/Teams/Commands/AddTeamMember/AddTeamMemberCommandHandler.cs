using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Commands.AddTeamMember;

public sealed class AddTeamMemberCommandHandler(
    ITeamRepository teamRepository,
    IPersonRepository personRepository,
    ITeamMembershipRepository membershipRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<AddTeamMemberCommand, Guid>
{
    public async Task<Guid> Handle(AddTeamMemberCommand request, CancellationToken cancellationToken)
    {
        _ = await teamRepository.GetByIdAsync(request.TeamId, cancellationToken)
            ?? throw new NotFoundException(nameof(Team), request.TeamId);

        _ = await personRepository.GetByIdAsync(request.PersonId, cancellationToken)
            ?? throw new NotFoundException(nameof(Person), request.PersonId);

        // End existing active membership on this team (iş kuralı: tarihçe korunur)
        var existing = await membershipRepository.GetActiveAsync(request.PersonId, request.TeamId, cancellationToken);
        if (existing is not null)
        {
            existing.End(request.StartDate.AddDays(-1));
            membershipRepository.Update(existing);
        }

        var membership = new TeamMembership
        {
            PersonId = request.PersonId,
            TeamId = request.TeamId,
            OrganizationRoleId = request.OrganizationRoleId,
            StartDate = request.StartDate
        };

        await membershipRepository.AddAsync(membership, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return membership.Id;
    }
}
