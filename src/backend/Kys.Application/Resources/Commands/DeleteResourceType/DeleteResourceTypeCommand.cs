using MediatR;

namespace Kys.Application.Resources.Commands.DeleteResourceType;

public sealed record DeleteResourceTypeCommand(Guid Id) : IRequest;
