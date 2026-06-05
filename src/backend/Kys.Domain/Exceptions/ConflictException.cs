namespace Kys.Domain.Exceptions;

public sealed class ConflictException(string message) : DomainException(message);
