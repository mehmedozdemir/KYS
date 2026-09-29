using FluentAssertions;
using Kys.Application.Grants.Commands.CreateGrant;
using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using NSubstitute;

namespace Kys.Application.Tests.Grants;

public sealed class CreateGrantCommandHandlerTests
{
    private readonly IAccessGrantRepository _repository = Substitute.For<IAccessGrantRepository>();
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly CreateGrantCommandHandler _handler;

    public CreateGrantCommandHandlerTests()
    {
        _handler = new CreateGrantCommandHandler(_repository, _currentUser, _unitOfWork);
    }

    private static CreateGrantCommand ScopeGrant(DateTime? expiresAt) => new(
        Guid.NewGuid(), GrantKind.Scope, GrantScopeType.Product, Guid.NewGuid(), GrantLevel.Write, null, expiresAt);

    [Fact]
    public async Task Handle_DateOnlyExpiry_IsStoredAsUtcEndOfDay()
    {
        var nextYear = DateTime.UtcNow.Year + 1;
        var unspecified = new DateTime(nextYear, 12, 31, 0, 0, 0, DateTimeKind.Unspecified);

        await _handler.Handle(ScopeGrant(unspecified), CancellationToken.None);

        await _repository.Received(1).AddAsync(Arg.Is<AccessGrant>(g =>
            g.ExpiresAt!.Value.Kind == DateTimeKind.Utc &&
            g.ExpiresAt.Value.Date == new DateTime(nextYear, 12, 31) &&
            g.ExpiresAt.Value.TimeOfDay > TimeSpan.FromHours(23)), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ExpiryInPast_Throws()
    {
        var act = () => _handler.Handle(ScopeGrant(new DateTime(2020, 1, 1)), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>().WithMessage("err.grant.expiryInPast");
    }

    [Fact]
    public async Task Handle_NoExpiry_IsStoredAsNull()
    {
        await _handler.Handle(ScopeGrant(null), CancellationToken.None);

        await _repository.Received(1).AddAsync(Arg.Is<AccessGrant>(g => g.ExpiresAt == null), Arg.Any<CancellationToken>());
    }
}
