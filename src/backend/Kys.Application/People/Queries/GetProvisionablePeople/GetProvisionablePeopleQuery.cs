using MediatR;

namespace Kys.Application.People.Queries.GetProvisionablePeople;

/// <summary>Platform kullanıcısı OLMAYAN kişileri ekibe göre gruplu döner (toplu platform'a alma için).</summary>
public sealed record GetProvisionablePeopleQuery : IRequest<IReadOnlyList<ProvisionableGroupDto>>;

public sealed record ProvisionableGroupDto(Guid? TeamId, string TeamName, IReadOnlyList<ProvisionablePersonDto> People);
public sealed record ProvisionablePersonDto(Guid Id, string FullName, string Email, string? Title);
