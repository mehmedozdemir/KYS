using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.People.Queries.GetPeople;

public sealed class GetPeopleQueryHandler(IPersonRepository personRepository)
    : IRequestHandler<GetPeopleQuery, GetPeopleResult>
{
    public async Task<GetPeopleResult> Handle(GetPeopleQuery request, CancellationToken cancellationToken)
    {
        var all = await personRepository.GetAllAsync(cancellationToken);

        var filtered = all.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLowerInvariant();
            filtered = filtered.Where(p =>
                p.FirstName.ToLowerInvariant().Contains(term) ||
                p.LastName.ToLowerInvariant().Contains(term) ||
                p.Email.ToLowerInvariant().Contains(term));
        }

        if (request.EmploymentStatus.HasValue)
            filtered = filtered.Where(p => p.EmploymentStatus == request.EmploymentStatus.Value);

        var total = filtered.Count();
        var items = filtered
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new PersonListDto(p.Id, p.FirstName, p.LastName, p.Email, p.Title, p.EmploymentStatus, p.IsPlatformUser, p.IsLocked))
            .ToList();

        return new GetPeopleResult(items, total, request.Page, request.PageSize);
    }
}
