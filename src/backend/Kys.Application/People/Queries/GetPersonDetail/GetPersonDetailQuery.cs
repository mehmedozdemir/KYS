using MediatR;

namespace Kys.Application.People.Queries.GetPersonDetail;

public sealed record GetPersonDetailQuery(Guid Id) : IRequest<PersonDetailDto>;
