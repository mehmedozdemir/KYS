using Kys.Domain.Enumerations;

namespace Kys.Application.People.Queries.GetPersonDetail;

public sealed record PersonDetailDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    string? Title,
    EmploymentStatus EmploymentStatus,
    DateOnly? HireDate,
    DateOnly? TerminationDate,
    bool IsPlatformUser,
    string? Username,
    bool IsLocked,
    DateTime? LastLoginAt,
    IReadOnlyList<PersonRoleDto> SystemRoles,
    IReadOnlyList<PersonTeamDto> TeamMemberships,
    Dictionary<string, object?> CustomFields
);

public sealed record PersonRoleDto(Guid RoleId, string RoleName, string RoleCode);
public sealed record PersonTeamDto(Guid TeamId, string TeamName, string OrganizationRole, DateOnly StartDate, DateOnly? EndDate);
