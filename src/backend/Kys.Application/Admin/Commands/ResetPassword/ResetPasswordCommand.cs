using MediatR;

namespace Kys.Application.Admin.Commands.ResetPassword;

public sealed record ResetPasswordCommand(Guid PersonId, string NewPassword) : IRequest;
