using MediatR;

namespace Kys.Application.People.Commands.MakePlatformUser;

/// <summary>Mevcut kişiyi platform kullanıcısı yapar (kullanıcı adı = e-posta, şifre belirlenir, karşılama maili gider).</summary>
public sealed record MakePlatformUserCommand(Guid PersonId, string Password) : IRequest;
