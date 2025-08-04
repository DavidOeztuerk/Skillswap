// using CQRS.Handlers;
// using Events;
// using Events.Domain.User;
// using Events.Security.ThreatDetection;
// using MassTransit;
// using Microsoft.EntityFrameworkCore;
// using UserService.Domain.Models;

// namespace UserService.Application.EventHandlers;

// // ============================================================================
// // AUTHENTICATION EVENT HANDLERS
// // ============================================================================

// public class UserLoggedInDomainEventHandler(
//     UserDbContext dbContext,
//     ILogger<UserLoggedInDomainEventHandler> logger)
//     : BaseDomainEventHandler<UserLoggedInDomainEvent>(logger)
// {
//     private readonly UserDbContext _dbContext = dbContext;

//     protected override async Task HandleDomainEvent(
//         UserLoggedInDomainEvent domainEvent,
//         CancellationToken cancellationToken)
//     {
//         // Log successful login activity
//         var activity = new UserActivity
//         {
//             UserId = domainEvent.UserId,
//             ActivityType = ActivityTypes.Login,
//             Description = "User logged in successfully",
//             IpAddress = domainEvent.IpAddress,
//             UserAgent = domainEvent.DeviceInfo,
//             Timestamp = DateTime.UtcNow,
//             MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
//             {
//                 LoginTime = DateTime.UtcNow,
//                 IpAddress = domainEvent.IpAddress,
//                 DeviceInfo = domainEvent.DeviceInfo
//             })
//         };

//         _dbContext.UserActivities.Add(activity);

//         // Create/Update user session
//         var sessionToken = Guid.NewGuid().ToString();
//         var session = new UserSession
//         {
//             UserId = domainEvent.UserId,
//             SessionToken = sessionToken,
//             IpAddress = domainEvent.IpAddress,
//             UserAgent = domainEvent.DeviceInfo,
//             StartedAt = DateTime.UtcNow,
//             LastActivity = DateTime.UtcNow,
//             IsActive = true
//         };

//         _dbContext.UserSessions.Add(session);
//         await _dbContext.SaveChangesAsync(cancellationToken);

//         Logger.LogInformation("Login activity logged for user {UserId}", domainEvent.UserId);
//     }
// }

// public class LoginAttemptFailedDomainEventHandler(
//     UserDbContext dbContext,
//     IPublishEndpoint publishEndpoint,
//     ILogger<LoginAttemptFailedDomainEventHandler> logger)
//     : BaseDomainEventHandler<LoginAttemptFailedDomainEvent>(logger)
// {
//     private readonly UserDbContext _dbContext = dbContext;
//     private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

//     protected override async Task HandleDomainEvent(
//         LoginAttemptFailedDomainEvent domainEvent,
//         CancellationToken cancellationToken)
//     {
//         // Find user for activity logging
//         var user = await _dbContext.Users
//             .FirstOrDefaultAsync(u => u.Email == domainEvent.Email, cancellationToken);

//         if (user != null)
//         {
//             // Log failed login activity
//             var activity = new UserActivity
//             {
//                 UserId = user.Id,
//                 ActivityType = ActivityTypes.FailedLogin,
//                 Description = $"Failed login attempt: {domainEvent.Reason}",
//                 IpAddress = domainEvent.IpAddress,
//                 Timestamp = DateTime.UtcNow,
//                 MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
//                 {
//                     FailureReason = domainEvent.Reason,
//                     AttemptTime = DateTime.UtcNow,
//                     IpAddress = domainEvent.IpAddress
//                 })
//             };

//             _dbContext.UserActivities.Add(activity);
//             await _dbContext.SaveChangesAsync(cancellationToken);

//             // Check for multiple failed attempts in short time
//             var recentFailedAttempts = await _dbContext.UserActivities
//                 .CountAsync(a => a.UserId == user.Id
//                            && a.ActivityType == ActivityTypes.FailedLogin
//                            && a.Timestamp >= DateTime.UtcNow.AddMinutes(-15), cancellationToken);

//             if (recentFailedAttempts >= 3)
//             {
//                 // Publish suspicious activity event
//                 await _publishEndpoint.Publish(new SuspiciousActivityDetectedEvent(
//                     user.Id,
//                     user.Email,
//                     "Multiple failed login attempts",
//                     domainEvent.IpAddress,
//                     recentFailedAttempts), cancellationToken);
//             }
//         }

//         Logger.LogWarning("Failed login attempt for email {Email} from IP {IpAddress}: {Reason}",
//             domainEvent.Email, domainEvent.IpAddress, domainEvent.Reason);
//     }
// }