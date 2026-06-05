using FluentValidation;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Kys.Application.Setup.Commands.InitializeSystem;

public sealed record InitializeSystemCommand(
    string FirstName,
    string LastName,
    string Email,
    string Username,
    string Password
) : IRequest;

public sealed class InitializeSystemCommandValidator : AbstractValidator<InitializeSystemCommand>
{
    public InitializeSystemCommandValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(50)
            .Matches("^[a-zA-Z0-9._-]+$").WithMessage("Username can only contain letters, numbers, dots, hyphens and underscores.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.");
    }
}

public sealed class InitializeSystemCommandHandler(
    IPersonRepository personRepository,
    IPasswordHasher<Person> passwordHasher,
    IUnitOfWork unitOfWork
) : IRequestHandler<InitializeSystemCommand>
{
    private static readonly Guid PlatformAdminRoleId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public async Task Handle(InitializeSystemCommand request, CancellationToken cancellationToken)
    {
        var alreadyInitialized = await personRepository.HasAnyPlatformUserAsync(cancellationToken);
        if (alreadyInitialized)
            throw new ConflictException("System is already initialized.");

        var person = new Person
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Username = request.Username,
            IsPlatformUser = true
        };

        person.PasswordHash = passwordHasher.HashPassword(person, request.Password);

        person.SystemRoles.Add(new PersonSystemRole
        {
            PersonId = person.Id,
            SystemRoleId = PlatformAdminRoleId,
            AssignedAt = DateTime.UtcNow
        });

        await personRepository.AddAsync(person, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
