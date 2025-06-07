
using CQRS.Handlers;
using Events;
using MassTransit;
using UserService.Domain.Events;
using UserService.Domain.Models;

namespace UserService.Application.EventHandlers;

// ============================================================================
// ACCOUNT STATUS EVENT HANDLERS
// ============================================================================

public class AccountStatusChangedDomainEventHandler(
    UserDbContext dbContext,
    IPublishEndpoint publishEndpoint,
    ILogger<AccountStatusChangedDomainEventHandler> logger)
    : BaseDomainEventHandler<AccountStatusChangedDomainEvent>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    protected override async Task HandleDomainEvent(
        AccountStatusChangedDomainEvent domainEvent,
        CancellationToken cancellationToken)
    {
        // Log account status change activity
        var activity = new UserActivity
        {
            UserId = domainEvent.UserId,
            ActivityType = "AccountStatusChanged",
            Description = $"Account status changed from {domainEvent.OldStatus} to {domainEvent.NewStatus}",
            Timestamp = DateTime.UtcNow,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                OldStatus = domainEvent.OldStatus,
                NewStatus = domainEvent.NewStatus,
                Reason = domainEvent.Reason,
                ChangedBy = domainEvent.ChangedBy
            })
        };

        _dbContext.UserActivities.Add(activity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Send account status notification if needed
        if (domainEvent.NewStatus == AccountStatus.Suspended)
        {
            await _publishEndpoint.Publish(new AccountSuspendedNotificationEvent(
                domainEvent.UserId,
                domainEvent.Email,
                domainEvent.Reason ?? "No reason provided"), cancellationToken);
        }
        else if (domainEvent.NewStatus == AccountStatus.Active && domainEvent.OldStatus == AccountStatus.Suspended)
        {
            await _publishEndpoint.Publish(new AccountReactivatedNotificationEvent(
                domainEvent.UserId,
                domainEvent.Email), cancellationToken);
        }

        Logger.LogInformation("Account status changed for user {UserId} from {OldStatus} to {NewStatus}",
            domainEvent.UserId, domainEvent.OldStatus, domainEvent.NewStatus);
    }
}