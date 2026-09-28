using Kys.Domain.Authorization;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Kys.Application.People.Commands.CreatePerson;

public sealed class CreatePersonCommandHandler(
    IPersonRepository personRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher<Person> passwordHasher,
    IAccountEmailService accountEmail,
    ILocalizer localizer,
    ISystemRoleRepository systemRoleRepository,
    ICurrentUserService currentUser
) : IRequestHandler<CreatePersonCommand, Guid>
{
    private static readonly Guid ReadOnlyRoleId = Guid.Parse("00000000-0000-0000-0000-000000000005");

    public async Task<Guid> Handle(CreatePersonCommand request, CancellationToken cancellationToken)
    {
        var existing = await personRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existing is not null)
            throw new DomainException(localizer.Get("err.person.emailInUse", request.Email));

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
            // Platform kullanıcısında kullanıcı adı = e-posta
            Username = request.IsPlatformUser ? request.Email : request.Username
        };

        if (request.IsPlatformUser && request.Password is not null)
            person.PasswordHash = passwordHasher.HashPassword(person, request.Password);

        // Platform kullanıcısı rolsüz kalmamalı (giriş yapıp hiçbir şey göremiyordu).
        // Salt Okuma dışındaki bir rolü yalnızca rol atama yetkisi olan kullanıcı verebilir (yetki yükseltme önlemi).
        if (request.IsPlatformUser)
        {
            var roleId = request.SystemRoleId ?? ReadOnlyRoleId;
            if (roleId != ReadOnlyRoleId && !currentUser.HasPermission(Capabilities.AdminUsers))
                throw new ForbiddenException("err.forbidden.assignRole");
            _ = await systemRoleRepository.GetByIdAsync(roleId, cancellationToken)
                ?? throw new NotFoundException(nameof(SystemRole), roleId);
            person.SystemRoles.Add(new PersonSystemRole
            {
                PersonId = person.Id,
                SystemRoleId = roleId,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = currentUser.UserId
            });
        }

        await personRepository.AddAsync(person, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        // Platform erişimi verildiyse karşılama e-postası gönder (best-effort)
        if (request.IsPlatformUser && !string.IsNullOrEmpty(request.Password))
            await accountEmail.SendPlatformWelcomeAsync(
                person.Email, $"{person.FirstName} {person.LastName}", person.Email, request.Password, cancellationToken);

        return person.Id;
    }
}
