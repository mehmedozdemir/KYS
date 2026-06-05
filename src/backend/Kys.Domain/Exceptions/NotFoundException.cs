namespace Kys.Domain.Exceptions;

public sealed class NotFoundException(string entityName, object key)
    : DomainException($"{entityName} with key '{key}' was not found.");
