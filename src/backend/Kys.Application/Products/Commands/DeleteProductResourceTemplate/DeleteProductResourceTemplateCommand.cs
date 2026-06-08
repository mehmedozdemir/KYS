using MediatR;

namespace Kys.Application.Products.Commands.DeleteProductResourceTemplate;

public sealed record DeleteProductResourceTemplateCommand(Guid TemplateId) : IRequest;
