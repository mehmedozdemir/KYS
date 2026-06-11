using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Email.Commands.SendTestEmail;

public sealed class SendTestEmailCommandHandler(IEmailSender emailSender)
    : IRequestHandler<SendTestEmailCommand>
{
    public async Task Handle(SendTestEmailCommand request, CancellationToken ct)
    {
        const string html = """
            <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222">
              <h2 style="color:#2563eb">KYS — Test E-postası</h2>
              <p>Bu bir test e-postasıdır. Bu mesajı aldıysanız SMTP yapılandırmanız doğru çalışıyor. ✅</p>
            </div>
            """;
        await emailSender.SendWithAsync(request.AccountId, request.ToEmail, "KYS — Test E-postası", html, ct);
    }
}
