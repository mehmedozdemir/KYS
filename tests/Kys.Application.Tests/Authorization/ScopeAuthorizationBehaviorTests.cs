using FluentAssertions;
using Kys.Application.Behaviors;
using Kys.Domain.Authorization;
using Kys.Domain.Exceptions;
using MediatR;
using NSubstitute;

namespace Kys.Application.Tests.Authorization;

public sealed class ScopeAuthorizationBehaviorTests
{
    private readonly IScopeService _scope = Substitute.For<IScopeService>();

    private sealed record ScopedCommand(Guid Id) : IRequest<Unit>, IScopedCommand
    {
        public ScopeTarget ScopeTarget => new(ScopeKind.Product, Id);
    }

    private sealed record NonScopedCommand : IRequest<Unit>;

    [Fact]
    public async Task Handle_ScopedCommand_Allowed_CallsNext()
    {
        var command = new ScopedCommand(Guid.NewGuid());
        _scope.CanWriteAsync(command.ScopeTarget, Arg.Any<CancellationToken>()).Returns(true);
        var behavior = new ScopeAuthorizationBehavior<ScopedCommand, Unit>(_scope);
        var nextCalled = false;
        RequestHandlerDelegate<Unit> next = _ => { nextCalled = true; return Task.FromResult(Unit.Value); };

        await behavior.Handle(command, next, CancellationToken.None);

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_ScopedCommand_Denied_ThrowsForbidden()
    {
        var command = new ScopedCommand(Guid.NewGuid());
        _scope.CanWriteAsync(command.ScopeTarget, Arg.Any<CancellationToken>()).Returns(false);
        var behavior = new ScopeAuthorizationBehavior<ScopedCommand, Unit>(_scope);
        RequestHandlerDelegate<Unit> next = _ => Task.FromResult(Unit.Value);

        var act = async () => await behavior.Handle(command, next, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_NonScopedCommand_SkipsScopeCheck()
    {
        var behavior = new ScopeAuthorizationBehavior<NonScopedCommand, Unit>(_scope);
        RequestHandlerDelegate<Unit> next = _ => Task.FromResult(Unit.Value);

        await behavior.Handle(new NonScopedCommand(), next, CancellationToken.None);

        await _scope.DidNotReceive().CanWriteAsync(Arg.Any<ScopeTarget>(), Arg.Any<CancellationToken>());
    }
}
