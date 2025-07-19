using CQRS.Handlers;
using Events;
using MassTransit;
using UserService.Domain.Models;
using Events.Domain.User;
using Events.Security.Authentication;
using Events.Notification;

namespace UserService.Application.EventHandlers;

// ============================================================================
// EMAIL VERIFICATION EVENT HANDLERS
// ============================================================================

public class EmailVerificationRequestedDomainEventHandler(
    IPublishEndpoint publishEndpoint,
    ILogger<EmailVerificationRequestedDomainEventHandler> logger) 
    : BaseDomainEventHandler<EmailVerificationRequestedDomainEvent>(logger)
{
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    protected override async Task HandleDomainEvent(
        EmailVerificationRequestedDomainEvent domainEvent, 
        CancellationToken cancellationToken)
    {
        // Publish to message bus for NotificationService to handle
        await _publishEndpoint.Publish(new EmailVerificationRequestedEvent(
            domainEvent.UserId,
            domainEvent.Email,
            domainEvent.VerificationToken,
            domainEvent.FirstName), cancellationToken);

        Logger.LogInformation("Published email verification requested event for user {UserId}", 
            domainEvent.UserId);
    }
}

public class EmailVerifiedDomainEventHandler : BaseDomainEventHandler<EmailVerifiedDomainEvent>
{
    private readonly UserDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;

    public EmailVerifiedDomainEventHandler(
        UserDbContext dbContext,
        IPublishEndpoint publishEndpoint,
        ILogger<EmailVerifiedDomainEventHandler> logger) : base(logger)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
    }

    protected override async Task HandleDomainEvent(
        EmailVerifiedDomainEvent domainEvent, 
        CancellationToken cancellationToken)
    {
        // Log activity
        var activity = new UserActivity
        {
            UserId = domainEvent.UserId,
            ActivityType = ActivityTypes.EmailVerification,
            Description = "Email address verified successfully",
            Timestamp = DateTime.UtcNow
        };

        _dbContext.UserActivities.Add(activity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish welcome email event
        await _publishEndpoint.Publish(new WelcomeEmailEvent(
            domainEvent.UserId,
            domainEvent.Email), cancellationToken);

        Logger.LogInformation("Email verified for user {UserId}", domainEvent.UserId);
    }
}
