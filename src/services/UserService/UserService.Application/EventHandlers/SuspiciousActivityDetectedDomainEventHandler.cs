// using CQRS.Handlers;
// using Events.Domain.User;
// using Events.Security.ThreatDetection;
// using MassTransit;
// using UserService.Domain.Models;

// namespace UserService.Application.EventHandlers;

// // ============================================================================
// // SECURITY EVENT HANDLERS
// // ============================================================================

// public class SuspiciousActivityDetectedDomainEventHandler(
//     UserDbContext dbContext,
//     IPublishEndpoint publishEndpoint,
//     ILogger<SuspiciousActivityDetectedDomainEventHandler> logger)
//     : BaseDomainEventHandler<SuspiciousActivityDetectedDomainEvent>(logger)
// {
//     private readonly UserDbContext _dbContext = dbContext;
//     private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

//     protected override async Task HandleDomainEvent(
//         SuspiciousActivityDetectedDomainEvent domainEvent,
//         CancellationToken cancellationToken)
//     {
//         // Log suspicious activity
//         var activity = new UserActivity
//         {
//             UserId = domainEvent.UserId,
//             ActivityType = ActivityTypes.SuspiciousActivity,
//             Description = $"Suspicious activity detected: {domainEvent.ActivityType}",
//             IpAddress = domainEvent.IpAddress,
//             UserAgent = domainEvent.UserAgent,
//             Timestamp = DateTime.UtcNow,
//             MetadataJson = System.Text.Json.JsonSerializer.Serialize(domainEvent.Details)
//         };

//         _dbContext.UserActivities.Add(activity);
//         await _dbContext.SaveChangesAsync(cancellationToken);

//         // Send security alert notification
//         await _publishEndpoint.Publish(new SecurityAlertEvent(
//             domainEvent.UserId,
//             domainEvent.Email,
//             domainEvent.ActivityType,
//             domainEvent.IpAddress), cancellationToken);

//         Logger.LogWarning("Suspicious activity detected for user {UserId}: {ActivityType} from IP {IpAddress}",
//             domainEvent.UserId, domainEvent.ActivityType, domainEvent.IpAddress);
//     }
// }