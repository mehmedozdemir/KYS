using Asp.Versioning;
using Kys.Application.Environments.Commands.CreateEnvironmentType;
using Kys.Api.Authorization;
using Kys.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/environment-types")]
[RequirePermission(SystemRole.Codes.PlatformAdmin)]
public sealed class EnvironmentTypesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateEnvironmentTypeRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateEnvironmentTypeCommand(
            request.Name,
            request.Code,
            request.Description,
            request.SortOrder,
            request.Color), ct);
        return Created($"api/v1/environments/types/{id}", new { id });
    }
}

public sealed record CreateEnvironmentTypeRequest(
    string Name,
    string Code,
    string? Description,
    int SortOrder,
    string? Color);
