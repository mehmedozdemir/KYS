using FluentAssertions;
using Kys.Application.Credentials.Commands.RevealCredential;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using NSubstitute;

namespace Kys.Application.Tests.Credentials;

public sealed class RevealCredentialCommandHandlerTests
{
    private readonly IEnvironmentRepository _envRepository = Substitute.For<IEnvironmentRepository>();
    private readonly IAuditLogRepository _auditLogRepository = Substitute.For<IAuditLogRepository>();
    private readonly IEncryptionService _encryption = Substitute.For<IEncryptionService>();
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();
    private readonly IResourceAuthorizationService _authorizationService = Substitute.For<IResourceAuthorizationService>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly RevealCredentialCommandHandler _handler;

    public RevealCredentialCommandHandlerTests()
    {
        _handler = new RevealCredentialCommandHandler(
            _envRepository, _auditLogRepository, _encryption, _currentUser, _authorizationService, _unitOfWork);
    }

    [Fact]
    public async Task Handle_CredentialNotFound_ThrowsDomainException()
    {
        var credentialId = Guid.NewGuid();
        _envRepository.GetCredentialByIdAsync(credentialId, Arg.Any<CancellationToken>())
            .Returns((ResourceCredential?)null);

        await _handler
            .Invoking(h => h.Handle(new RevealCredentialCommand(credentialId), CancellationToken.None))
            .Should().ThrowAsync<DomainException>();
    }

    [Fact]
    public async Task Handle_UserNotAuthorized_ThrowsForbiddenException()
    {
        var credentialId = Guid.NewGuid();
        var resourceId = Guid.NewGuid();
        var credential = new ResourceCredential
        {
            Id = credentialId,
            EnvironmentResourceId = resourceId,
            FieldKey = "password",
            EncryptedValue = "enc",
            Iv = "iv"
        };

        _envRepository.GetCredentialByIdAsync(credentialId, Arg.Any<CancellationToken>())
            .Returns(credential);
        _authorizationService.CanAccessEnvironmentResourceAsync(resourceId, Arg.Any<CancellationToken>())
            .Returns(false);

        await _handler
            .Invoking(h => h.Handle(new RevealCredentialCommand(credentialId), CancellationToken.None))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_AuthorizedUser_ReturnsDecryptedValue()
    {
        var credentialId = Guid.NewGuid();
        var resourceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var credential = new ResourceCredential
        {
            Id = credentialId,
            EnvironmentResourceId = resourceId,
            FieldKey = "password",
            EncryptedValue = "enc123",
            Iv = "iv123"
        };

        _envRepository.GetCredentialByIdAsync(credentialId, Arg.Any<CancellationToken>())
            .Returns(credential);
        _authorizationService.CanAccessEnvironmentResourceAsync(resourceId, Arg.Any<CancellationToken>())
            .Returns(true);
        _currentUser.UserId.Returns(userId);
        _encryption.DecryptWithIv("enc123", "iv123").Returns("plain-secret");

        var result = await _handler.Handle(new RevealCredentialCommand(credentialId), CancellationToken.None);

        result.Should().Be("plain-secret");
        await _auditLogRepository.Received(1).AddAsync(
            Arg.Is<AuditLog>(l => l.Action == "CredentialRevealed" && l.EntityId == credentialId && l.ChangedBy == userId),
            Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SharedResourceCredential_AuthorizedUser_ReturnsDecryptedValue()
    {
        var credentialId = Guid.NewGuid();
        var sharedResourceId = Guid.NewGuid();
        var credential = new ResourceCredential
        {
            Id = credentialId,
            SharedResourceId = sharedResourceId,
            FieldKey = "api_key",
            EncryptedValue = "enc_shared",
            Iv = "iv_shared"
        };

        _envRepository.GetCredentialByIdAsync(credentialId, Arg.Any<CancellationToken>())
            .Returns(credential);
        _authorizationService.CanAccessSharedResourceAsync(sharedResourceId, Arg.Any<CancellationToken>())
            .Returns(true);
        _encryption.DecryptWithIv("enc_shared", "iv_shared").Returns("api-key-value");

        var result = await _handler.Handle(new RevealCredentialCommand(credentialId), CancellationToken.None);

        result.Should().Be("api-key-value");
    }
}
