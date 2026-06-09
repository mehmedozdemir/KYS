using MediatR;

namespace Kys.Application.Environments.Commands.DeleteEnvironmentType;

public sealed record DeleteEnvironmentTypeCommand(Guid Id) : IRequest;
