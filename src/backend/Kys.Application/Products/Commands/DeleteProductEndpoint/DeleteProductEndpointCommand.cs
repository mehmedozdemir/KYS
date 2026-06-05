using MediatR;

namespace Kys.Application.Products.Commands.DeleteProductEndpoint;

public sealed record DeleteProductEndpointCommand(Guid Id) : IRequest;
