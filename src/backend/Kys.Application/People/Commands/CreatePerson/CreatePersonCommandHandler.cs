using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Kys.Application.People.Commands.CreatePerson;

public sealed class CreatePersonCommandHandler(
    IPersonRepository personRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher<Person> passwordHasher
) : IRequestHandler<CreatePersonCommand, Guid>
{
    public async Task<Guid> Handle(CreatePersonCommand request, CancellationToken cancellationToken)
    {
        var existing = await personRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existing is not null)
            throw new DomainException($"Email '{request.Email}' is already in use.");

        var person = new Person
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            Title = request.Title,
            EmploymentStatus = request.EmploymentStatus,
            HireDate = request.HireDate,
            IsPlatformUser = request.IsPlatformUser,
            Username = request.Username
        };

        if (request.IsPlatformUser && request.Password is not null)
            person.PasswordHash = passwordHasher.HashPassword(person, request.Password);

        await personRepository.AddAsync(person, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return person.Id;
    }
}
