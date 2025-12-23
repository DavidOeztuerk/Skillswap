using CQRS.Handlers;
using Events.Domain.User;
using Microsoft.Extensions.Logging;

namespace UserService.Application.EventHandlers;

// ============================================================================
// AUTHENTICATION EVENT HANDLERS
// ============================================================================

public class UserLoggedInDomainEventHandler(
    ILogger<UserLoggedInDomainEventHandler> logger)
    : BaseDomainEventHandler<UserLoggedInDomainEvent>(logger)
{
    protected override async Task HandleDomainEvent(
        UserLoggedInDomainEvent domainEvent,
        CancellationToken cancellationToken)
    {
        // Log successful login activity (persistence handled in Infrastructure layer)
        Logger.LogInformation("User {UserId} logged in successfully from IP {IpAddress}",
            domainEvent.UserId, domainEvent.IpAddress);

        await Task.CompletedTask;
    }
}

public class LoginAttemptFailedDomainEventHandler(
    ILogger<LoginAttemptFailedDomainEventHandler> logger)
    : BaseDomainEventHandler<LoginAttemptFailedDomainEvent>(logger)
{
    protected override async Task HandleDomainEvent(
        LoginAttemptFailedDomainEvent domainEvent,
        CancellationToken cancellationToken)
    {
        // Log failed login attempt (persistence and suspicious activity detection handled in Infrastructure layer)
        Logger.LogWarning("Failed login attempt for email {Email} from IP {IpAddress}: {Reason}",
            domainEvent.Email, domainEvent.IpAddress, domainEvent.Reason);

        await Task.CompletedTask;
    }
}
