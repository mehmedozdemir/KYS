using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.People.Commands.UpdatePerson;

public sealed class UpdatePersonCommandHandler(
    IPersonRepository personRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdatePersonCommand>
{
    public async Task Handle(UpdatePersonCommand request, CancellationToken cancellationToken)
    {
        var person = await personRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Person), request.Id);

        person.FirstName = request.FirstName;
        person.LastName = request.LastName;
        person.Phone = request.Phone;
        person.Title = request.Title;
        person.HireDate = request.HireDate;

        personRepository.Update(person);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
