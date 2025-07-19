using CQRS.Handlers;
using Events.Domain.User;
using Events.Security.Authentication;
using MassTransit;
using UserService.Domain.Models;

namespace UserService.Application.EventHandlers;

// ============================================================================
// PASSWORD EVENT HANDLERS
// ============================================================================

public class PasswordChangedDomainEventHandler(
    UserDbContext dbContext,
    IPublishEndpoint publishEndpoint,
    ILogger<PasswordChangedDomainEventHandler> logger) 
    : BaseDomainEventHandler<PasswordChangedDomainEvent>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    protected override async Task HandleDomainEvent(
        PasswordChangedDomainEvent domainEvent, 
        CancellationToken cancellationToken)
    {
        // Log password change activity
        var activity = new UserActivity
        {
            UserId = domainEvent.UserId,
            ActivityType = ActivityTypes.PasswordChange,
            Description = "Password changed successfully",
            Timestamp = DateTime.UtcNow
        };

        _dbContext.UserActivities.Add(activity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Send password changed notification email
        await _publishEndpoint.Publish(new PasswordChangedNotificationEvent(
            domainEvent.UserId,
            domainEvent.Email), cancellationToken);

        Logger.LogInformation("Password changed for user {UserId}", domainEvent.UserId);
    }
}

public class PasswordResetRequestedDomainEventHandler : BaseDomainEventHandler<PasswordResetRequestedDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;

    public PasswordResetRequestedDomainEventHandler(
        IPublishEndpoint publishEndpoint,
        ILogger<PasswordResetRequestedDomainEventHandler> logger) : base(logger)
    {
        _publishEndpoint = publishEndpoint;
    }

    protected override async Task HandleDomainEvent(
        PasswordResetRequestedDomainEvent domainEvent, 
        CancellationToken cancellationToken)
    {
        // Publish password reset email event
        await _publishEndpoint.Publish(new PasswordResetEmailEvent(
            domainEvent.UserId,
            domainEvent.Email,
            domainEvent.ResetToken,
            domainEvent.FirstName), cancellationToken);

        Logger.LogInformation("Password reset requested for user {UserId}", domainEvent.UserId);
    }
}

public class PasswordResetCompletedDomainEventHandler : BaseDomainEventHandler<PasswordResetCompletedDomainEvent>
{
    private readonly UserDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;

    public PasswordResetCompletedDomainEventHandler(
        UserDbContext dbContext,
        IPublishEndpoint publishEndpoint,
        ILogger<PasswordResetCompletedDomainEventHandler> logger) : base(logger)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
    }

    protected override async Task HandleDomainEvent(
        PasswordResetCompletedDomainEvent domainEvent, 
        CancellationToken cancellationToken)
    {
        // Log password reset activity
        var activity = new UserActivity
        {
            UserId = domainEvent.UserId,
            ActivityType = ActivityTypes.PasswordReset,
            Description = "Password reset completed successfully",
            Timestamp = DateTime.UtcNow
        };

        _dbContext.UserActivities.Add(activity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Send password reset confirmation email
        await _publishEndpoint.Publish(new PasswordResetCompletedNotificationEvent(
            domainEvent.UserId,
            domainEvent.Email), cancellationToken);

        Logger.LogInformation("Password reset completed for user {UserId}", domainEvent.UserId);
    }
}