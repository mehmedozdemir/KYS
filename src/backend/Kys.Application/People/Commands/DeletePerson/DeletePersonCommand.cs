using MediatR;

namespace Kys.Application.People.Commands.DeletePerson;

public sealed record DeletePersonCommand(Guid Id) : IRequest;
