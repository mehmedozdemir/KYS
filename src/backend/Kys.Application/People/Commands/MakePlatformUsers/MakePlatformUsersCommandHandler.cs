using System.Security.Cryptography;
using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Kys.Application.People.Commands.MakePlatformUsers;

public sealed class MakePlatformUsersCommandHandler(
    IPersonRepository personRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher<Person> passwordHasher,
    IAccountEmailService accountEmail) : IRequestHandler<MakePlatformUsersCommand, int>
{
    public async Task<int> Handle(MakePlatformUsersCommand request, CancellationToken ct)
    {
        var provisioned = new List<(Person Person, string Password)>();

        foreach (var id in request.PersonIds.Distinct())
        {
            var person = await personRepository.GetByIdAsync(id, ct);
            // Geçersiz/zaten platform/e-postasız olanları atla
            if (person is null || person.IsPlatformUser || string.IsNullOrWhiteSpace(person.Email))
                continue;

            var password = GeneratePassword();
            person.IsPlatformUser = true;
            person.Username = person.Email;
            person.PasswordHash = passwordHasher.HashPassword(person, password);
            personRepository.Update(person);
            provisioned.Add((person, password));
        }

        if (provisioned.Count == 0)
            return 0;

        await unitOfWork.SaveChangesAsync(ct);

        // Karşılama mailleri (kuyruğa atılır, arka planda gönderilir)
        foreach (var (person, password) in provisioned)
            await accountEmail.SendPlatformWelcomeAsync(
                person.Email, $"{person.FirstName} {person.LastName}", person.Email, password, ct);

        return provisioned.Count;
    }

    // Güçlü rastgele şifre (büyük/küçük/rakam/özel, 12 karakter)
    private static string GeneratePassword()
    {
        const string U = "ABCDEFGHJKLMNPQRSTUVWXYZ", L = "abcdefghijkmnpqrstuvwxyz", D = "23456789", S = "!@#$%&*?";
        var all = U + L + D + S;
        Span<char> chars = stackalloc char[12];
        chars[0] = U[RandomNumberGenerator.GetInt32(U.Length)];
        chars[1] = L[RandomNumberGenerator.GetInt32(L.Length)];
        chars[2] = D[RandomNumberGenerator.GetInt32(D.Length)];
        chars[3] = S[RandomNumberGenerator.GetInt32(S.Length)];
        for (var i = 4; i < chars.Length; i++)
            chars[i] = all[RandomNumberGenerator.GetInt32(all.Length)];
        // karıştır
        for (var i = chars.Length - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }
        return new string(chars);
    }
}
