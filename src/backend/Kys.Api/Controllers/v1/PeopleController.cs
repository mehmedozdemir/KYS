using Asp.Versioning;
using Kys.Application.People.Commands.CreatePerson;
using Kys.Application.People.Commands.DeletePerson;
using Kys.Application.People.Commands.UpdateEmploymentStatus;
using Kys.Application.People.Commands.UpdatePerson;
using Kys.Application.People.Queries.GetPeople;
using Kys.Application.People.Queries.GetPersonDetail;
using Kys.Domain.Enumerations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/people")]
[Authorize]
public sealed class PeopleController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(GetPeopleResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] EmploymentStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetPeopleQuery(search, status, page, pageSize), ct));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PersonDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetPersonDetailQuery(id), ct));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreatePersonCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id, version = "1" }, new { id });
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeletePersonCommand(id), ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePersonRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdatePersonCommand(id, request.FirstName, request.LastName, request.Phone, request.Title, request.HireDate), ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/employment-status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateEmploymentStatusRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateEmploymentStatusCommand(id, request.NewStatus, request.TerminationDate, request.TerminationReason), ct);
        return NoContent();
    }
}

public sealed record UpdatePersonRequest(string FirstName, string LastName, string? Phone, string? Title, DateOnly? HireDate);
public sealed record UpdateEmploymentStatusRequest(EmploymentStatus NewStatus, DateOnly? TerminationDate, string? TerminationReason);
