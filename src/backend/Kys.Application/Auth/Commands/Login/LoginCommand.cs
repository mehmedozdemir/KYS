using MediatR;

namespace Kys.Application.Auth.Commands.Login;

public sealed record LoginCommand(string Email, string Password) : IRequest<LoginResult>;

public sealed record LoginResult(string AccessToken, string RefreshToken, Guid PersonId, string FullName);
