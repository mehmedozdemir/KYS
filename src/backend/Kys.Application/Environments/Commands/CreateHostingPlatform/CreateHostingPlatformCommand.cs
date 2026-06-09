using MediatR;

namespace Kys.Application.Environments.Commands.CreateHostingPlatform;

public sealed record CreateHostingPlatformCommand(
    string Name,
    string Code,
    string? Description,
    string? Category,
    string? Icon,
    string? Color,
    int SortOrder) : IRequest<Guid>;
