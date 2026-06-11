using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.People.Queries.GetProvisionablePeople;

public sealed class GetProvisionablePeopleQueryHandler(
    ITeamRepository teamRepository,
    IPersonRepository personRepository) : IRequestHandler<GetProvisionablePeopleQuery, IReadOnlyList<ProvisionableGroupDto>>
{
    public async Task<IReadOnlyList<ProvisionableGroupDto>> Handle(GetProvisionablePeopleQuery request, CancellationToken ct)
    {
        var teams = await teamRepository.GetAllAsync(ct);
        var allPeople = await personRepository.GetAllAsync(ct);

        // Platform kullanıcısı olmayan ve e-postası olan kişiler aday
        static bool Provisionable(Domain.Entities.Person p) => !p.IsPlatformUser && !string.IsNullOrWhiteSpace(p.Email);

        var groups = new List<ProvisionableGroupDto>();
        var assignedIds = new HashSet<Guid>();

        foreach (var team in teams.OrderBy(t => t.Name))
        {
            var members = team.Memberships
                .Where(m => m.EndDate == null && m.Person is not null && Provisionable(m.Person))
                .Select(m => m.Person!)
                .DistinctBy(p => p.Id)
                .OrderBy(p => p.FirstName)
                .Select(p => new ProvisionablePersonDto(p.Id, $"{p.FirstName} {p.LastName}", p.Email, p.Title))
                .ToList();

            foreach (var m in team.Memberships.Where(m => m.EndDate == null && m.Person is not null))
                assignedIds.Add(m.PersonId);

            if (members.Count > 0)
                groups.Add(new ProvisionableGroupDto(team.Id, team.Name, members));
        }

        // Aktif ekip üyeliği olmayan adaylar → "Ekipsiz"
        var ungrouped = allPeople
            .Where(p => Provisionable(p) && !assignedIds.Contains(p.Id))
            .OrderBy(p => p.FirstName)
            .Select(p => new ProvisionablePersonDto(p.Id, $"{p.FirstName} {p.LastName}", p.Email, p.Title))
            .ToList();

        if (ungrouped.Count > 0)
            groups.Add(new ProvisionableGroupDto(null, "Ekipsiz", ungrouped));

        return groups;
    }
}
