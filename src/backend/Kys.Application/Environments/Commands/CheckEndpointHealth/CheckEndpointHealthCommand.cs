using Kys.Application.Environments.Queries.GetEnvironmentDetail;
using Kys.Domain.Authorization;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Environments.Commands.CheckEndpointHealth;

/// <summary>Bir ortam endpoint'inin health URL'ini hemen kontrol eder ve sonucu kaydeder.</summary>
public sealed record CheckEndpointHealthCommand(Guid EnvironmentId, Guid ProductEndpointId)
    : IRequest<EndpointHealthDto>, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Environment, EnvironmentId);
}

public sealed class CheckEndpointHealthCommandHandler(
    IEnvironmentRepository environments,
    IEndpointHealthRepository healthRepository,
    IEndpointHealthChecker checker,
    IDateTimeProvider clock,
    IUnitOfWork unitOfWork) : IRequestHandler<CheckEndpointHealthCommand, EndpointHealthDto>
{
    public async Task<EndpointHealthDto> Handle(CheckEndpointHealthCommand request, CancellationToken ct)
    {
        var endpoint = await environments.GetEndpointAsync(request.EnvironmentId, request.ProductEndpointId, ct)
            ?? throw new NotFoundException(nameof(CustomerEnvironmentEndpoint), request.ProductEndpointId);
        if (string.IsNullOrWhiteSpace(endpoint.HealthCheckUrl))
            throw new DomainException("err.endpoint.noHealthUrl");

        var probe = await checker.ProbeAsync(endpoint.HealthCheckUrl, ct);

        var health = await healthRepository.GetAsync(endpoint.Id, ct);
        if (health is null)
        {
            health = new EndpointHealth { CustomerEnvironmentEndpointId = endpoint.Id };
            healthRepository.Add(health);
        }
        health.Apply(probe, clock.UtcNow);
        await unitOfWork.SaveChangesAsync(ct);

        return EndpointHealthDto.From(health);
    }
}
