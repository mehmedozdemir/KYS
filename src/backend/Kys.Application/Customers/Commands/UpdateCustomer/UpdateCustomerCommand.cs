using Kys.Application.CustomFields;
using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Customers.Commands.UpdateCustomer;

public sealed record UpdateCustomerCommand(
    Guid Id,
    string Name,
    string? ShortName,
    string? Description,
    string? Sector,
    string? Country,
    string? City,
    string? PrimaryContactName,
    string? PrimaryContactEmail,
    string? PrimaryContactPhone,
    Dictionary<string, object?>? CustomFields
) : IRequest, IHasCustomFields, IScopedCommand
{
    CustomFieldEntityType IHasCustomFields.EntityType => CustomFieldEntityType.Customer;
    Dictionary<string, object?> IHasCustomFields.CustomFields => CustomFields ?? [];
    public ScopeTarget ScopeTarget => new(ScopeKind.Customer, Id);
}
