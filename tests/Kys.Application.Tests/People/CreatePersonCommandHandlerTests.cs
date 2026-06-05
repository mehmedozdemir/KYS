using FluentAssertions;
using Kys.Application.People.Commands.CreatePerson;
using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.AspNetCore.Identity;
using NSubstitute;

namespace Kys.Application.Tests.People;

public sealed class CreatePersonCommandHandlerTests
{
    private readonly IPersonRepository _personRepository = Substitute.For<IPersonRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IPasswordHasher<Person> _passwordHasher = Substitute.For<IPasswordHasher<Person>>();
    private readonly CreatePersonCommandHandler _handler;

    public CreatePersonCommandHandlerTests()
    {
        _handler = new CreatePersonCommandHandler(_personRepository, _unitOfWork, _passwordHasher);
    }

    [Fact]
    public async Task Handle_WhenEmailAlreadyExists_ThrowsDomainException()
    {
        var command = CreateCommand();
        _personRepository.GetByEmailAsync(command.Email, Arg.Any<CancellationToken>())
            .Returns(new Person { Email = command.Email });

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*already in use*");
    }

    [Fact]
    public async Task Handle_WhenEmailIsUnique_CreatesPersonAndReturnsId()
    {
        var command = CreateCommand();
        _personRepository.GetByEmailAsync(command.Email, Arg.Any<CancellationToken>())
            .Returns((Person?)null);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().NotBeEmpty();
        await _personRepository.Received(1).AddAsync(
            Arg.Is<Person>(p => p.Email == command.Email), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenIsPlatformUserWithPassword_HashesPassword()
    {
        var command = CreateCommand() with { IsPlatformUser = true, Username = "jdoe", Password = "secret123" };
        _personRepository.GetByEmailAsync(command.Email, Arg.Any<CancellationToken>())
            .Returns((Person?)null);
        _passwordHasher.HashPassword(Arg.Any<Person>(), "secret123").Returns("hashed_value");

        await _handler.Handle(command, CancellationToken.None);

        _passwordHasher.Received(1).HashPassword(Arg.Any<Person>(), "secret123");
        await _personRepository.Received(1).AddAsync(
            Arg.Is<Person>(p => p.PasswordHash == "hashed_value"), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenNotPlatformUser_DoesNotHashPassword()
    {
        var command = CreateCommand() with { IsPlatformUser = false };
        _personRepository.GetByEmailAsync(command.Email, Arg.Any<CancellationToken>())
            .Returns((Person?)null);

        await _handler.Handle(command, CancellationToken.None);

        _passwordHasher.DidNotReceive().HashPassword(Arg.Any<Person>(), Arg.Any<string>());
    }

    private static CreatePersonCommand CreateCommand() => new(
        FirstName: "John",
        LastName: "Doe",
        Email: "john.doe@example.com",
        Phone: null,
        Title: "Developer",
        EmploymentStatus: EmploymentStatus.Active,
        HireDate: DateOnly.FromDateTime(DateTime.Today),
        IsPlatformUser: false,
        Username: null,
        Password: null
    );
}
