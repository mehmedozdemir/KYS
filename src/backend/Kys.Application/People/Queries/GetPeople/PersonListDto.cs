using Kys.Domain.Enumerations;

namespace Kys.Application.People.Queries.GetPeople;

public sealed record PersonListDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string? Title,
    EmploymentStatus EmploymentStatus,
    bool IsPlatformUser,
    bool IsLocked
);

public sealed record GetPeopleResult(
    IReadOnlyList<PersonListDto> Items,
    int TotalCount,
    int Page,
    int PageSize
);
