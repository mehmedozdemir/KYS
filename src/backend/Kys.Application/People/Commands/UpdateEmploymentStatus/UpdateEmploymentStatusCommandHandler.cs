using Kys.Domain.Enumerations;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.People.Commands.UpdateEmploymentStatus;

public sealed class UpdateEmploymentStatusCommandHandler(
    IPersonRepository personRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateEmploymentStatusCommand>
{
    public async Task Handle(UpdateEmploymentStatusCommand request, CancellationToken cancellationToken)
    {
        var person = await personRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Person), request.Id);

        if (request.NewStatus is EmploymentStatus.Terminated or EmploymentStatus.Resigned)
        {
            if (request.TerminationDate is null)
                throw new DomainException("err.person.terminationDateRequired");

            person.Terminate(request.TerminationDate.Value, request.TerminationReason);
        }
        else
        {
            person.EmploymentStatus = request.NewStatus;
        }

        personRepository.Update(person);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
