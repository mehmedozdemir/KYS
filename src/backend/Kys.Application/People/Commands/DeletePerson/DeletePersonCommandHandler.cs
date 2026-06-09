using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.People.Commands.DeletePerson;

public sealed class DeletePersonCommandHandler(
    IPersonRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeletePersonCommand>
{
    public async Task Handle(DeletePersonCommand request, CancellationToken ct)
    {
        var person = await repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("Person", request.Id);

        person.IsDeleted = true;
        person.DeletedAt = DateTime.UtcNow;

        repository.Update(person);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
