using Asp.Versioning;
using Kys.Api.Authorization;
using Kys.Application.Email.Commands.CreateEmailAccount;
using Kys.Application.Email.Commands.DeleteEmailAccount;
using Kys.Application.Email.Commands.SendTestEmail;
using Kys.Application.Email.Commands.SetActiveEmailAccount;
using Kys.Application.Email.Commands.UpdateEmailAccount;
using Kys.Application.Email.Queries.GetEmailAccounts;
using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/email-accounts")]
[RequirePermission(Capabilities.AdminConfig)]
public sealed class EmailAccountsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await mediator.Send(new GetEmailAccountsQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmailAccountRequest r, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateEmailAccountCommand(
            r.Name, r.Provider, r.Host, r.Port, r.Security, r.Username, r.Password,
            r.FromAddress, r.FromName, r.MakeActive), ct);
        return Created(string.Empty, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmailAccountRequest r, CancellationToken ct)
    {
        await mediator.Send(new UpdateEmailAccountCommand(
            id, r.Name, r.Provider, r.Host, r.Port, r.Security, r.Username, r.Password,
            r.FromAddress, r.FromName), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        await mediator.Send(new SetActiveEmailAccountCommand(id), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteEmailAccountCommand(id), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/test")]
    public async Task<IActionResult> SendTest(Guid id, [FromBody] SendTestRequest r, CancellationToken ct)
    {
        await mediator.Send(new SendTestEmailCommand(id, r.ToEmail), ct);
        return NoContent();
    }
}

public sealed record CreateEmailAccountRequest(
    string Name, EmailProvider Provider, string Host, int Port, EmailSecurity Security,
    string Username, string Password, string FromAddress, string? FromName, bool MakeActive);

public sealed record UpdateEmailAccountRequest(
    string Name, EmailProvider Provider, string Host, int Port, EmailSecurity Security,
    string Username, string? Password, string FromAddress, string? FromName);

public sealed record SendTestRequest(string ToEmail);
