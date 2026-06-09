using MediatR;

namespace Kys.Application.Environments.Commands.UpdateHostingPlatform;

public sealed record UpdateHostingPlatformCommand(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    string? Category,
    string? Icon,
    string? Color,
    int SortOrder,
    bool IsActive) : IRequest;
