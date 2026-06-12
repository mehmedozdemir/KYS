using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Email.Commands.SendTestEmail;

public sealed class SendTestEmailCommandHandler(IEmailSender emailSender, ILocalizer localizer)
    : IRequestHandler<SendTestEmailCommand>
{
    public async Task Handle(SendTestEmailCommand request, CancellationToken ct)
    {
        var heading = localizer["email.test.heading"];
        var body = localizer["email.test.body"];
        var html = $$"""
            <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222">
              <h2 style="color:#2563eb">{{heading}}</h2>
              <p>{{body}}</p>
            </div>
            """;
        await emailSender.SendWithAsync(request.AccountId, request.ToEmail, localizer["email.test.subject"], html, ct);
    }
}
