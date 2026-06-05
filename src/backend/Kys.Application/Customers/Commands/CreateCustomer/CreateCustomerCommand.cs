using Kys.Application.CustomFields;
using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Customers.Commands.CreateCustomer;

public sealed record CreateCustomerCommand(
    string Name,
    string Code,
    string? ShortName,
    string? Description,
    string? Sector,
    string? Country,
    string? City,
    string? PrimaryContactName,
    string? PrimaryContactEmail,
    string? PrimaryContactPhone,
    Dictionary<string, object?>? CustomFields
) : IRequest<Guid>, IHasCustomFields
{
    CustomFieldEntityType IHasCustomFields.EntityType => CustomFieldEntityType.Customer;
    Dictionary<string, object?> IHasCustomFields.CustomFields => CustomFields ?? [];
}
