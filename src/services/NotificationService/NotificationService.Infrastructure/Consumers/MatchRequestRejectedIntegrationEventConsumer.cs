using Events.Integration.Matchmaking;
using Microsoft.Extensions.Logging;
using NotificationService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Services;
using Microsoft.Extensions.DependencyInjection;

namespace NotificationService.Infrastructure.Consumers;

public class MatchRequestRejectedIntegrationEventConsumer : IConsumer<MatchRequestRejectedIntegrationEvent>
{
    private readonly INotificationOrchestrator _notificationOrchestrator;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly IUserServiceClient _userServiceClient;
    private readonly ILogger<MatchRequestRejectedIntegrationEventConsumer> _logger;

    public MatchRequestRejectedIntegrationEventConsumer(
        INotificationOrchestrator notificationOrchestrator,
        IServiceScopeFactory serviceScopeFactory,
        IUserServiceClient userServiceClient,
        ILogger<MatchRequestRejectedIntegrationEventConsumer> logger)
    {
        _notificationOrchestrator = notificationOrchestrator;
        _serviceScopeFactory = serviceScopeFactory;
        _userServiceClient = userServiceClient;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<MatchRequestRejectedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation("Received MatchRequestRejectedIntegrationEvent for Request: {RequestId}", message.RequestId);

        try
        {
            // Get email address for requester
            var contactInfoList = await _userServiceClient.GetUserContactInfoAsync(
                new List<string> { message.RequesterId },
                context.CancellationToken);

            var requesterEmail = contactInfoList.FirstOrDefault(c => c.UserId == message.RequesterId)?.Email;

            if (string.IsNullOrEmpty(requesterEmail))
            {
                _logger.LogWarning("Could not find email for requester user {UserId}", message.RequesterId);
                return;
            }

            // Create notification for requester
            var notification = new Notification
            {
                UserId = message.RequesterId,
                Type = "EMAIL",
                Template = "match_rejected",
                Recipient = requesterEmail,
                Subject = "Match-Anfrage abgelehnt",
                Content = $"{message.TargetUserName} hat deine Anfrage für '{message.SkillName}' abgelehnt",
                Priority = "Low",
                Status = "Pending",
                MetadataJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
                {
                    ["RequestId"] = message.RequestId,
                    ["SkillId"] = message.SkillId,
                    ["SkillName"] = message.SkillName,
                    ["RejectedBy"] = message.TargetUserId,
                    ["RejectedByName"] = message.TargetUserName,
                    ["RejectionReason"] = message.RejectionReason ?? ""
                }),
                CreatedAt = DateTime.UtcNow,
                ScheduledAt = DateTime.UtcNow
            };

            // Create a new scope to save notification
            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
                dbContext.Notifications.Add(notification);
                await dbContext.SaveChangesAsync();
            }

            // Send the saved notification with correct email recipient
            var success = await _notificationOrchestrator.SendNotificationAsync(notification);
            if (success)
            {
                _logger.LogInformation("Sent rejection notification to {UserId} at {Email}",
                    message.RequesterId, requesterEmail);
            }
            else
            {
                _logger.LogWarning("Failed to send rejection notification to {UserId}", message.RequesterId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing MatchRequestRejectedIntegrationEvent for Request: {RequestId}", message.RequestId);
            throw;
        }
    }

    private string BuildRejectionEmail(MatchRequestRejectedIntegrationEvent message)
    {
        var reasonSection = "";
        if (!string.IsNullOrEmpty(message.RejectionReason))
        {
            reasonSection = $@"
    <div style='background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>📝 Begründung:</h4>
        <p style='font-style: italic;'>{message.RejectionReason}</p>
    </div>";
        }

        return $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <h2 style='color: #f44336;'>Match-Anfrage abgelehnt</h2>

    <p>Hallo {message.RequesterName},</p>
    <p>Leider hat <strong>{message.TargetUserName}</strong> deine Match-Anfrage für den Skill <strong>{message.SkillName}</strong> abgelehnt.</p>
    {reasonSection}
    <div style='background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0; color: #2196F3;'>💡 Was du jetzt tun kannst:</h4>
        <ul>
            <li>Suche nach anderen Anbietern für diesen Skill</li>
            <li>Verbessere dein Profil und deine Anfrage-Nachricht</li>
            <li>Biete einen Skill-Tausch oder eine Bezahlung an</li>
            <li>Versuche es zu einem späteren Zeitpunkt erneut</li>
        </ul>
    </div>
    <div style='margin: 30px 0; text-align: center;'>
        <a href='https://skillswap.app/skills'
           style='display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;'>
            Andere Skills entdecken
        </a>
    </div>
    <p style='color: #666; font-size: 14px;'>
        Lass dich nicht entmutigen! Es gibt viele andere Nutzer, die ihre Skills gerne mit dir teilen möchten.
    </p>
    <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>
    <p style='color: #999; font-size: 12px;'>
        © 2024 SkillSwap - Tausche Wissen, erweitere Horizonte
    </p>
</div>";
    }
}
