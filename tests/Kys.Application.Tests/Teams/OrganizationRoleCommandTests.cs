using FluentAssertions;
using Kys.Application.Teams.Commands.OrganizationRoles;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using NSubstitute;

namespace Kys.Application.Tests.Teams;

public sealed class OrganizationRoleCommandTests
{
    private readonly ITeamRepository _repository = Substitute.For<ITeamRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task Create_DuplicateName_Throws()
    {
        _repository.OrganizationRoleNameExistsAsync("Mobil Geliştirici", null, Arg.Any<CancellationToken>()).Returns(true);
        var handler = new CreateOrganizationRoleCommandHandler(_repository, _unitOfWork);

        var act = () => handler.Handle(new CreateOrganizationRoleCommand("  Mobil Geliştirici ", null), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>().WithMessage("err.orgRole.nameExists");
        await _repository.DidNotReceive().AddOrganizationRoleAsync(Arg.Any<OrganizationRole>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_TrimsAndSaves()
    {
        var handler = new CreateOrganizationRoleCommandHandler(_repository, _unitOfWork);

        await handler.Handle(new CreateOrganizationRoleCommand(" Veri Mühendisi ", "  "), CancellationToken.None);

        await _repository.Received(1).AddOrganizationRoleAsync(
            Arg.Is<OrganizationRole>(r => r.Name == "Veri Mühendisi" && r.Description == null), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_RoleInActiveUse_Throws()
    {
        var role = new OrganizationRole { Name = "Backend Geliştirici" };
        _repository.GetOrganizationRoleByIdAsync(role.Id, Arg.Any<CancellationToken>()).Returns(role);
        _repository.CountActiveMembershipsForRoleAsync(role.Id, Arg.Any<CancellationToken>()).Returns(3);
        var handler = new DeleteOrganizationRoleCommandHandler(_repository, _unitOfWork);

        var act = () => handler.Handle(new DeleteOrganizationRoleCommand(role.Id), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>().WithMessage("err.orgRole.inUse");
        role.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public async Task Delete_UnusedRole_SoftDeletes()
    {
        var role = new OrganizationRole { Name = "Eski Rol" };
        _repository.GetOrganizationRoleByIdAsync(role.Id, Arg.Any<CancellationToken>()).Returns(role);
        var handler = new DeleteOrganizationRoleCommandHandler(_repository, _unitOfWork);

        await handler.Handle(new DeleteOrganizationRoleCommand(role.Id), CancellationToken.None);

        role.IsDeleted.Should().BeTrue();
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
