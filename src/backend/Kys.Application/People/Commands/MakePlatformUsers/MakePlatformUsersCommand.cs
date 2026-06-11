using MediatR;

namespace Kys.Application.People.Commands.MakePlatformUsers;

/// <summary>Seçili kişileri toplu platform kullanıcısı yapar (her birine otomatik şifre + karşılama maili).</summary>
public sealed record MakePlatformUsersCommand(IReadOnlyList<Guid> PersonIds) : IRequest<int>;
