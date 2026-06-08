using Asp.Versioning;
using Kys.Application.CustomFields.Queries.GetCustomFieldDefinitions;
using Kys.Domain.Enumerations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/custom-field-definitions")]
[Authorize]
public sealed class CustomFieldDefinitionsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CustomFieldDefinitionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] CustomFieldEntityType entityType,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetCustomFieldDefinitionsQuery(entityType, ActiveOnly: true), ct));
}
