namespace Kys.Domain.Exceptions;

public sealed class ForbiddenException(string message = "Access denied.")
    : DomainException(message);
