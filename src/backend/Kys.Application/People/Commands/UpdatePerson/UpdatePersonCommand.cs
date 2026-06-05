using MediatR;

namespace Kys.Application.People.Commands.UpdatePerson;

public sealed record UpdatePersonCommand(
    Guid Id,
    string FirstName,
    string LastName,
    string? Phone,
    string? Title,
    DateOnly? HireDate
) : IRequest;
