using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.People.Commands.CreatePerson;

public sealed record CreatePersonCommand(
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    string? Title,
    EmploymentStatus EmploymentStatus,
    DateOnly? HireDate,
    bool IsPlatformUser,
    string? Username,
    string? Password,
    Guid? SystemRoleId = null   // platform kullanıcısı için; verilmezse Salt Okuma (en az yetki)
) : IRequest<Guid>;
