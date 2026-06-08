using MediatR;

namespace Kys.Application.Resources.Commands.DeleteSharedResource;

public sealed record DeleteSharedResourceCommand(Guid Id) : IRequest;
