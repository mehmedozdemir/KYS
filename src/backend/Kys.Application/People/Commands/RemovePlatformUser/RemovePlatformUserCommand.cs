using MediatR;

namespace Kys.Application.People.Commands.RemovePlatformUser;

/// <summary>Kişinin platform erişimini geri alır (kişi kaydı silinmez; kullanıcı adı/şifre/oturum temizlenir).</summary>
public sealed record RemovePlatformUserCommand(Guid PersonId) : IRequest;
