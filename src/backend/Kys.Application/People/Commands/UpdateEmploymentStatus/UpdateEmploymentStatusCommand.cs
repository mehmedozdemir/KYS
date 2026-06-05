using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.People.Commands.UpdateEmploymentStatus;

public sealed record UpdateEmploymentStatusCommand(
    Guid Id,
    EmploymentStatus NewStatus,
    DateOnly? TerminationDate,
    string? TerminationReason
) : IRequest;
