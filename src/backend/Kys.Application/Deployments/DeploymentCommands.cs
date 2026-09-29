using FluentValidation;
using Kys.Domain.Authorization;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Deployments;

/// <summary>Müşteri-ürün için planlanan canlıya geçiş tarihi (null = hedef yok).</summary>
public sealed record SetTargetGoLiveCommand(Guid CustomerId, Guid ProductId, DateOnly? TargetGoLiveAt)
    : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Customer, CustomerId);
}

public sealed class SetTargetGoLiveCommandHandler(ICustomerRepository repository, IUnitOfWork unitOfWork)
    : IRequestHandler<SetTargetGoLiveCommand>
{
    public async Task Handle(SetTargetGoLiveCommand request, CancellationToken cancellationToken)
    {
        var cp = await repository.GetCustomerProductAsync(request.CustomerId, request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(CustomerProduct), $"{request.CustomerId}/{request.ProductId}");

        cp.TargetGoLiveAt = request.TargetGoLiveAt;
        repository.UpdateCustomerProduct(cp);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

/// <summary>Ortamda kurulu ürün sürümü (null/boş = bilinmiyor).</summary>
public sealed record SetDeployedVersionCommand(Guid EnvironmentId, string? DeployedVersion)
    : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Environment, EnvironmentId);
}

public sealed class SetDeployedVersionCommandValidator : AbstractValidator<SetDeployedVersionCommand>
{
    public SetDeployedVersionCommandValidator()
        => RuleFor(x => x.DeployedVersion).MaximumLength(50);
}

public sealed class SetDeployedVersionCommandHandler(IEnvironmentRepository repository, IUnitOfWork unitOfWork)
    : IRequestHandler<SetDeployedVersionCommand>
{
    public async Task Handle(SetDeployedVersionCommand request, CancellationToken cancellationToken)
    {
        var environment = await repository.GetEnvironmentByIdAsync(request.EnvironmentId, cancellationToken)
            ?? throw new NotFoundException(nameof(CustomerEnvironment), request.EnvironmentId);

        environment.DeployedVersion = string.IsNullOrWhiteSpace(request.DeployedVersion) ? null : request.DeployedVersion.Trim();
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
