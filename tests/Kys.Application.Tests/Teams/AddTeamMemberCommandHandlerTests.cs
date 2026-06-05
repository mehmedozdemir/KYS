using FluentAssertions;
using Kys.Application.Teams.Commands.AddTeamMember;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using NSubstitute;

namespace Kys.Application.Tests.Teams;

public sealed class AddTeamMemberCommandHandlerTests
{
    private readonly ITeamRepository _teamRepository = Substitute.For<ITeamRepository>();
    private readonly IPersonRepository _personRepository = Substitute.For<IPersonRepository>();
    private readonly ITeamMembershipRepository _membershipRepository = Substitute.For<ITeamMembershipRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly AddTeamMemberCommandHandler _handler;

    private static readonly Guid TeamId = Guid.NewGuid();
    private static readonly Guid PersonId = Guid.NewGuid();
    private static readonly Guid RoleId = Guid.NewGuid();

    public AddTeamMemberCommandHandlerTests()
    {
        _handler = new AddTeamMemberCommandHandler(
            _teamRepository, _personRepository, _membershipRepository, _unitOfWork);
    }

    [Fact]
    public async Task Handle_WhenTeamNotFound_ThrowsNotFoundException()
    {
        _teamRepository.GetByIdAsync(TeamId, Arg.Any<CancellationToken>()).Returns((Team?)null);

        var act = () => _handler.Handle(CreateCommand(), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenPersonNotFound_ThrowsNotFoundException()
    {
        _teamRepository.GetByIdAsync(TeamId, Arg.Any<CancellationToken>()).Returns(new Team { Id = TeamId });
        _personRepository.GetByIdAsync(PersonId, Arg.Any<CancellationToken>()).Returns((Person?)null);

        var act = () => _handler.Handle(CreateCommand(), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenNoExistingMembership_CreatesMembership()
    {
        SetupHappyPath();
        _membershipRepository.GetActiveAsync(PersonId, TeamId, Arg.Any<CancellationToken>())
            .Returns((TeamMembership?)null);

        var startDate = new DateOnly(2025, 1, 1);
        var result = await _handler.Handle(CreateCommand(startDate), CancellationToken.None);

        result.Should().NotBeEmpty();
        await _membershipRepository.Received(1).AddAsync(
            Arg.Is<TeamMembership>(m =>
                m.PersonId == PersonId &&
                m.TeamId == TeamId &&
                m.StartDate == startDate),
            Arg.Any<CancellationToken>());
        _membershipRepository.DidNotReceive().Update(Arg.Any<TeamMembership>());
    }

    [Fact]
    public async Task Handle_WhenActiveExistingMembership_EndsItBeforeCreatingNew()
    {
        SetupHappyPath();
        var startDate = new DateOnly(2025, 6, 1);
        var existingMembership = new TeamMembership
        {
            PersonId = PersonId,
            TeamId = TeamId,
            StartDate = new DateOnly(2025, 1, 1)
        };
        _membershipRepository.GetActiveAsync(PersonId, TeamId, Arg.Any<CancellationToken>())
            .Returns(existingMembership);

        await _handler.Handle(CreateCommand(startDate), CancellationToken.None);

        // Business rule: existing membership EndDate = new StartDate - 1 day
        existingMembership.EndDate.Should().Be(startDate.AddDays(-1));
        existingMembership.IsActive.Should().BeFalse();
        _membershipRepository.Received(1).Update(existingMembership);
        await _membershipRepository.Received(1).AddAsync(Arg.Any<TeamMembership>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    private void SetupHappyPath()
    {
        _teamRepository.GetByIdAsync(TeamId, Arg.Any<CancellationToken>()).Returns(new Team { Id = TeamId });
        _personRepository.GetByIdAsync(PersonId, Arg.Any<CancellationToken>()).Returns(new Person { Id = PersonId });
    }

    private static AddTeamMemberCommand CreateCommand(DateOnly? startDate = null) => new(
        TeamId, PersonId, RoleId, startDate ?? new DateOnly(2025, 1, 1));
}
