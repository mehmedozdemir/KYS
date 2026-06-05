using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.People.Queries.GetPeople;

public sealed record GetPeopleQuery(
    string? SearchTerm = null,
    EmploymentStatus? EmploymentStatus = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<GetPeopleResult>;
