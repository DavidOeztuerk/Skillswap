using Events.Integration.Matchmaking;
using MassTransit;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Services;

namespace NotificationService.Application.Consumers;

public class MatchRequestCreatedIntegrationEventConsumer : IConsumer<MatchRequestCreatedIntegrationEvent>
{
    private readonly INotificationOrchestrator _notificationOrchestrator;
    private readonly NotificationDbContext _dbContext;
    private readonly ILogger<MatchRequestCreatedIntegrationEventConsumer> _logger;

    public MatchRequestCreatedIntegrationEventConsumer(
        INotificationOrchestrator notificationOrchestrator,
        NotificationDbContext dbContext,
        ILogger<MatchRequestCreatedIntegrationEventConsumer> logger)
    {
        _notificationOrchestrator = notificationOrchestrator;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<MatchRequestCreatedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation("Received MatchRequestCreatedIntegrationEvent for Request: {RequestId}", message.RequestId);

        try
        {
            // Create notification record for target user
            var notification = new Notification
            {
                UserId = message.TargetUserId,
                Type = "MatchRequest",
                Template = "match_request_received",
                Recipient = message.TargetUserId,
                Subject = "Neue Match-Anfrage erhalten!",
                Content = $"{message.RequesterName} möchte '{message.SkillName}' von dir lernen",
                Priority = "High",
                Status = "Pending",
                MetadataJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
                {
                    ["RequestId"] = message.RequestId,
                    ["RequesterId"] = message.RequesterId,
                    ["RequesterName"] = message.RequesterName,
                    ["SkillId"] = message.SkillId,
                    ["SkillName"] = message.SkillName,
                    ["ThreadId"] = message.ThreadId,
                    ["IsSkillExchange"] = message.IsSkillExchange.ToString(),
                    ["IsMonetary"] = message.IsMonetary.ToString()
                }),
                CreatedAt = DateTime.UtcNow,
                ScheduledAt = DateTime.UtcNow
            };

            _dbContext.Notifications.Add(notification);
            await _dbContext.SaveChangesAsync();

            // Build detailed email content
            var emailBody = BuildMatchRequestEmail(message);

            // Send notification via orchestrator
            await _notificationOrchestrator.SendNotificationAsync(
                recipientUserId: message.TargetUserId,
                type: "MatchRequest",
                title: "Neue Match-Anfrage für " + message.SkillName,
                message: emailBody,
                priority: "High",
                metadata: new Dictionary<string, object>
                {
                    ["RequestId"] = message.RequestId,
                    ["ThreadId"] = message.ThreadId,
                    ["ActionUrl"] = $"https://skillswap.app/matchmaking/timeline/{message.ThreadId}"
                });

            _logger.LogInformation("Successfully sent match request notification to user {UserId}", message.TargetUserId);

            // Send confirmation to requester
            await SendConfirmationToRequester(message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing MatchRequestCreatedIntegrationEvent for Request: {RequestId}", message.RequestId);
            throw;
        }
    }

    private async Task SendConfirmationToRequester(MatchRequestCreatedIntegrationEvent message)
    {
        // Create confirmation notification for requester
        var notification = new Notification
        {
            UserId = message.RequesterId,
            Type = "MatchRequestSent",
            Template = "match_request_sent",
            Recipient = message.RequesterId,
            Subject = "Match-Anfrage gesendet",
            Content = $"Deine Anfrage für '{message.SkillName}' wurde an {message.TargetUserName} gesendet",
            Priority = "Low",
            Status = "Pending",
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["RequestId"] = message.RequestId,
                ["TargetUserId"] = message.TargetUserId,
                ["TargetUserName"] = message.TargetUserName,
                ["SkillId"] = message.SkillId,
                ["SkillName"] = message.SkillName
            }),
            CreatedAt = DateTime.UtcNow,
            ScheduledAt = DateTime.UtcNow
        };

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Sent confirmation notification to requester {UserId}", message.RequesterId);
    }

    private string BuildMatchRequestEmail(MatchRequestCreatedIntegrationEvent message)
    {
        var offerSection = "";
        
        if (message.IsSkillExchange && !string.IsNullOrEmpty(message.ExchangeSkillName))
        {
            offerSection = $@"
    <div style='background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>🔄 Skill-Tausch angeboten:</h4>
        <p>{message.RequesterName} bietet im Gegenzug <strong>{message.ExchangeSkillName}</strong> an!</p>
    </div>";
        }
        else if (message.IsMonetary && message.OfferedAmount.HasValue)
        {
            offerSection = $@"
    <div style='background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>💰 Bezahlung angeboten:</h4>
        <p>{message.OfferedAmount:C} {message.Currency ?? "EUR"} pro Session</p>
    </div>";
        }

        var sessionDetails = "";
        if (message.TotalSessions > 1)
        {
            sessionDetails = $@"
    <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>📅 Session-Details:</h4>
        <ul>
            <li>Anzahl Sessions: {message.TotalSessions}</li>
            <li>Dauer pro Session: {message.SessionDurationMinutes} Minuten</li>
            <li>Bevorzugte Tage: {string.Join(", ", message.PreferredDays)}</li>
            <li>Bevorzugte Zeiten: {string.Join(", ", message.PreferredTimes)}</li>
        </ul>
    </div>";
        }

        return $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <h2 style='color: #2196F3;'>🎯 Neue Match-Anfrage erhalten!</h2>
    
    <p>Hallo {message.TargetUserName},</p>
    
    <p><strong>{message.RequesterName}</strong> möchte gerne <strong>{message.SkillName}</strong> von dir lernen!</p>
    
    <div style='background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>💬 Nachricht von {message.RequesterName}:</h4>
        <p style='font-style: italic;'>{message.Message}</p>
    </div>
    
    {offerSection}
    {sessionDetails}
    
    <div style='margin: 30px 0; text-align: center;'>
        <a href='https://skillswap.app/matchmaking/timeline/{message.ThreadId}' 
           style='display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;'>
            Anfrage ansehen & antworten
        </a>
    </div>
    
    <p style='color: #666; font-size: 14px;'>
        Du kannst die Anfrage annehmen, ablehnen oder ein Gegenangebot machen.
    </p>
    
    <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>
    
    <p style='color: #999; font-size: 12px;'>
        © 2024 SkillSwap - Tausche Wissen, erweitere Horizonte
    </p>
</div>";
    }
}