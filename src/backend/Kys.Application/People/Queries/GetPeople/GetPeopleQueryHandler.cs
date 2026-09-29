using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.People.Queries.GetPeople;

public sealed class GetPeopleQueryHandler(IPersonRepository personRepository)
    : IRequestHandler<GetPeopleQuery, GetPeopleResult>
{
    private static readonly System.Globalization.CultureInfo TurkishCulture =
        System.Globalization.CultureInfo.GetCultureInfo("tr-TR");

    public async Task<GetPeopleResult> Handle(GetPeopleQuery request, CancellationToken cancellationToken)
    {
        var all = await personRepository.GetAllAsync(cancellationToken);

        var filtered = all.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            // Türkçe kültürle küçült (Invariant "İ"yi "i̇" yapıp eşleşmeyi bozar) ve her kelimeyi
            // ad-soyad-e-posta birleşiminde ara: "Can Öz" → "Can Öztürk" bulunur.
            var terms = request.SearchTerm.ToLower(TurkishCulture)
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            filtered = filtered.Where(p =>
            {
                var haystack = $"{p.FirstName} {p.LastName} {p.Email}".ToLower(TurkishCulture);
                return terms.All(haystack.Contains);
            });
        }

        if (request.EmploymentStatus.HasValue)
            filtered = filtered.Where(p => p.EmploymentStatus == request.EmploymentStatus.Value);

        filtered = filtered
            .OrderBy(p => p.FirstName, StringComparer.Create(TurkishCulture, true))
            .ThenBy(p => p.LastName, StringComparer.Create(TurkishCulture, true));

        var total = filtered.Count();
        var items = filtered
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new PersonListDto(p.Id, p.FirstName, p.LastName, p.Email, p.Title, p.EmploymentStatus, p.IsPlatformUser, p.IsLocked))
            .ToList();

        return new GetPeopleResult(items, total, request.Page, request.PageSize);
    }
}
