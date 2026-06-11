using MediatR;

namespace Kys.Application.Email.Commands.SendTestEmail;

public sealed record SendTestEmailCommand(Guid AccountId, string ToEmail) : IRequest;
