using Asp.Versioning;
using Kys.Application.Teams.Commands.AddTeamMember;
using Kys.Application.Teams.Commands.CreateTeam;
using Kys.Application.Teams.Commands.DeleteTeam;
using Kys.Application.Teams.Commands.EndTeamMembership;
using Kys.Application.Teams.Queries.GetTeamDetail;
using Kys.Application.Teams.Queries.GetTeams;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/teams")]
[Authorize]
public sealed class TeamsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedTeamsResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetTeamsQuery(search, page, pageSize), ct));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TeamDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetTeamDetailQuery(id), ct));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreateTeamCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id, version = "1" }, new { id });
    }

    [HttpPost("{teamId:guid}/members")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddMember(Guid teamId, [FromBody] AddMemberRequest request, CancellationToken ct)
    {
        var membershipId = await mediator.Send(
            new AddTeamMemberCommand(teamId, request.PersonId, request.OrganizationRoleId, request.StartDate), ct);
        return Created(string.Empty, new { id = membershipId });
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteTeamCommand(id), ct);
        return NoContent();
    }

    [HttpDelete("{teamId:guid}/members/{personId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EndMembership(Guid teamId, Guid personId, [FromQuery] DateOnly endDate, CancellationToken ct)
    {
        await mediator.Send(new EndTeamMembershipCommand(personId, teamId, endDate), ct);
        return NoContent();
    }
}

public sealed record AddMemberRequest(Guid PersonId, Guid OrganizationRoleId, DateOnly StartDate);
