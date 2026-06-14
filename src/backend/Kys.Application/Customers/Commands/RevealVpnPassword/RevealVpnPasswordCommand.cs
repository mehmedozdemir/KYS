using MediatR;

namespace Kys.Application.Customers.Commands.RevealVpnPassword;

public sealed record RevealVpnPasswordCommand(Guid VpnConfigId) : IRequest<string>;
