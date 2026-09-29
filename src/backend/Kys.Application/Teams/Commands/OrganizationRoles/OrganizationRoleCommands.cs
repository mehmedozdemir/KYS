using FluentValidation;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Commands.OrganizationRoles;

// Ekip üyeliklerinde kullanılan organizasyon rolleri (ör. "Mobil Geliştirici", "Veri Mühendisi").

public sealed record CreateOrganizationRoleCommand(string Name, string? Description) : IRequest<Guid>;
public sealed record UpdateOrganizationRoleCommand(Guid Id, string Name, string? Description) : IRequest;
public sealed record DeleteOrganizationRoleCommand(Guid Id) : IRequest;

public sealed class CreateOrganizationRoleCommandValidator : AbstractValidator<CreateOrganizationRoleCommand>
{
    public CreateOrganizationRoleCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public sealed class UpdateOrganizationRoleCommandValidator : AbstractValidator<UpdateOrganizationRoleCommand>
{
    public UpdateOrganizationRoleCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public sealed class CreateOrganizationRoleCommandHandler(ITeamRepository repository, IUnitOfWork unitOfWork)
    : IRequestHandler<CreateOrganizationRoleCommand, Guid>
{
    public async Task<Guid> Handle(CreateOrganizationRoleCommand request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        if (await repository.OrganizationRoleNameExistsAsync(name, null, cancellationToken))
            throw new DomainException("err.orgRole.nameExists");

        var role = new OrganizationRole
        {
            Name = name,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()
        };
        await repository.AddOrganizationRoleAsync(role, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return role.Id;
    }
}

public sealed class UpdateOrganizationRoleCommandHandler(ITeamRepository repository, IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateOrganizationRoleCommand>
{
    public async Task Handle(UpdateOrganizationRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await repository.GetOrganizationRoleByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(OrganizationRole), request.Id);

        var name = request.Name.Trim();
        if (await repository.OrganizationRoleNameExistsAsync(name, role.Id, cancellationToken))
            throw new DomainException("err.orgRole.nameExists");

        role.Name = name;
        role.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        repository.UpdateOrganizationRole(role);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

public sealed class DeleteOrganizationRoleCommandHandler(ITeamRepository repository, IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteOrganizationRoleCommand>
{
    public async Task Handle(DeleteOrganizationRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await repository.GetOrganizationRoleByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(OrganizationRole), request.Id);

        // Devam eden üyeliklerde kullanılan rol silinemez; geçmiş üyelikler soft-delete ile korunur.
        if (await repository.CountActiveMembershipsForRoleAsync(role.Id, cancellationToken) > 0)
            throw new DomainException("err.orgRole.inUse");

        role.IsDeleted = true;
        role.DeletedAt = DateTime.UtcNow;
        repository.UpdateOrganizationRole(role);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
