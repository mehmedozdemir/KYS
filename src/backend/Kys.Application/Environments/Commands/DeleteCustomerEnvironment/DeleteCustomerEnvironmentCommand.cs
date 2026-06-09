using MediatR;

namespace Kys.Application.Environments.Commands.DeleteCustomerEnvironment;

public sealed record DeleteCustomerEnvironmentCommand(Guid EnvironmentId) : IRequest;
