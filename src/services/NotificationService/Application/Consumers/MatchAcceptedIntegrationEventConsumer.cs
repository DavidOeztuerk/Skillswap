using Events.Integration.Matchmaking;
using MassTransit;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Services;

namespace NotificationService.Application.Consumers;

public class MatchAcceptedIntegrationEventConsumer : IConsumer<MatchAcceptedIntegrationEvent>
{
    private readonly INotificationOrchestrator _notificationOrchestrator;
    private readonly NotificationDbContext _dbContext;
    private readonly ILogger<MatchAcceptedIntegrationEventConsumer> _logger;

    public MatchAcceptedIntegrationEventConsumer(
        INotificationOrchestrator notificationOrchestrator,
        NotificationDbContext dbContext,
        ILogger<MatchAcceptedIntegrationEventConsumer> logger)
    {
        _notificationOrchestrator = notificationOrchestrator;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<MatchAcceptedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation("Received MatchAcceptedIntegrationEvent for Match: {MatchId}", message.MatchId);

        try
        {
            // Send notification to both users
            await SendAcceptanceNotificationToRequester(message);
            await SendAcceptanceNotificationToTarget(message);

            _logger.LogInformation("Successfully sent match acceptance notifications for Match: {MatchId}", message.MatchId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing MatchAcceptedIntegrationEvent for Match: {MatchId}", message.MatchId);
            throw;
        }
    }

    private async Task SendAcceptanceNotificationToRequester(MatchAcceptedIntegrationEvent message)
    {
        // Create notification for requester (they initiated the match request)
        var notification = new Notification
        {
            UserId = message.RequesterId,
            Type = "MatchAccepted",
            Template = "match_accepted",
            Recipient = message.RequesterId, // Will be resolved to email/phone
            Subject = "Match-Anfrage angenommen!",
            Content = $"{message.TargetUserName} hat deine Anfrage für '{message.SkillName}' angenommen",
            Priority = "High",
            Status = "Pending",
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["MatchId"] = message.MatchId,
                ["RequestId"] = message.RequestId,
                ["SkillId"] = message.SkillId,
                ["SkillName"] = message.SkillName,
                ["AcceptedBy"] = message.TargetUserId,
                ["AcceptedByName"] = message.TargetUserName
            }),
            CreatedAt = DateTime.UtcNow,
            ScheduledAt = DateTime.UtcNow
        };

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync();

        // Build email content
        var emailBodyForRequester = BuildAcceptanceEmailForRequester(message);

        // Send notification
        await _notificationOrchestrator.SendNotificationAsync(
            recipientUserId: message.RequesterId,
            type: "MatchAccepted",
            title: "Match-Anfrage angenommen!",
            message: emailBodyForRequester,
            priority: "High",
            metadata: new Dictionary<string, object>
            {
                ["MatchId"] = message.MatchId,
                ["ActionUrl"] = $"https://skillswap.app/matches/{message.MatchId}"
            });

        _logger.LogInformation("Sent acceptance notification to requester {UserId}", message.RequesterId);
    }

    private async Task SendAcceptanceNotificationToTarget(MatchAcceptedIntegrationEvent message)
    {
        // Create notification for target user (they accepted)
        var notification = new Notification
        {
            UserId = message.TargetUserId,
            Type = "MatchAccepted",
            Template = "match_confirmed",
            Recipient = message.TargetUserId,
            Subject = "Match bestätigt",
            Content = $"Du hast die Anfrage von {message.RequesterName} für '{message.SkillName}' angenommen",
            Priority = "Normal",
            Status = "Pending",
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["MatchId"] = message.MatchId,
                ["RequestId"] = message.RequestId,
                ["SkillId"] = message.SkillId,
                ["SkillName"] = message.SkillName,
                ["RequestedBy"] = message.RequesterId,
                ["RequestedByName"] = message.RequesterName
            }),
            CreatedAt = DateTime.UtcNow,
            ScheduledAt = DateTime.UtcNow
        };

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync();

        // Build email content  
        var emailBodyForTarget = BuildAcceptanceEmailForTarget(message);

        // Send notification
        await _notificationOrchestrator.SendNotificationAsync(
            recipientUserId: message.TargetUserId,
            type: "MatchAccepted",
            title: "Match bestätigt",
            message: emailBodyForTarget,
            priority: "Normal",
            metadata: new Dictionary<string, object>
            {
                ["MatchId"] = message.MatchId,
                ["ActionUrl"] = $"https://skillswap.app/matches/{message.MatchId}"
            });

        _logger.LogInformation("Sent acceptance notification to target user {UserId}", message.TargetUserId);
    }

    private string BuildAcceptanceEmailForRequester(MatchAcceptedIntegrationEvent message)
    {
        var exchangeSection = "";
        if (message.IsSkillExchange && !string.IsNullOrEmpty(message.ExchangeSkillName))
        {
            exchangeSection = $@"
    <div style='background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>🔄 Skill-Tausch vereinbart:</h4>
        <p>Du lernst: <strong>{message.SkillName}</strong></p>
        <p>Du unterrichtest: <strong>{message.ExchangeSkillName}</strong></p>
    </div>";
        }

        var paymentSection = "";
        if (message.IsMonetary && message.AgreedAmount.HasValue)
        {
            paymentSection = $@"
    <div style='background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>💰 Vereinbarte Bezahlung:</h4>
        <p>{message.AgreedAmount:C} {message.Currency ?? "EUR"} pro Session</p>
    </div>";
        }

        return $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <h2 style='color: #4caf50;'>🎉 Deine Match-Anfrage wurde angenommen!</h2>
    
    <p>Hallo {message.RequesterName},</p>
    
    <p>Großartige Neuigkeiten! <strong>{message.TargetUserName}</strong> hat deine Anfrage für den Skill <strong>{message.SkillName}</strong> angenommen.</p>
    
    {exchangeSection}
    {paymentSection}
    
    <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>📅 Session-Details:</h4>
        <ul>
            <li>Dauer: {message.SessionDurationMinutes} Minuten pro Session</li>
            <li>Anzahl Sessions: {message.TotalSessions}</li>
        </ul>
    </div>
    
    <div style='margin: 30px 0; text-align: center;'>
        <a href='https://skillswap.app/matches/{message.MatchId}' 
           style='display: inline-block; padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;'>
            Match-Details anzeigen
        </a>
    </div>
    
    <p style='color: #666; font-size: 14px;'>
        Als nächstes wird automatisch ein Termin für eure erste Session erstellt. Du erhältst eine weitere Benachrichtigung mit den Termindetails.
    </p>
    
    <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>
    
    <p style='color: #999; font-size: 12px;'>
        © 2024 SkillSwap - Tausche Wissen, erweitere Horizonte
    </p>
</div>";
    }

    private string BuildAcceptanceEmailForTarget(MatchAcceptedIntegrationEvent message)
    {
        var exchangeSection = "";
        if (message.IsSkillExchange && !string.IsNullOrEmpty(message.ExchangeSkillName))
        {
            exchangeSection = $@"
    <div style='background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>🔄 Skill-Tausch vereinbart:</h4>
        <p>Du unterrichtest: <strong>{message.SkillName}</strong></p>
        <p>Du lernst: <strong>{message.ExchangeSkillName}</strong></p>
    </div>";
        }

        var paymentSection = "";
        if (message.IsMonetary && message.AgreedAmount.HasValue)
        {
            paymentSection = $@"
    <div style='background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>💰 Vereinbarte Bezahlung:</h4>
        <p>Du erhältst: {message.AgreedAmount:C} {message.Currency ?? "EUR"} pro Session</p>
    </div>";
        }

        return $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <h2 style='color: #4caf50;'>✅ Match bestätigt!</h2>
    
    <p>Hallo {message.TargetUserName},</p>
    
    <p>Du hast die Match-Anfrage von <strong>{message.RequesterName}</strong> für den Skill <strong>{message.SkillName}</strong> erfolgreich angenommen.</p>
    
    {exchangeSection}
    {paymentSection}
    
    <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h4 style='margin-top: 0;'>📅 Session-Details:</h4>
        <ul>
            <li>Dauer: {message.SessionDurationMinutes} Minuten pro Session</li>
            <li>Anzahl Sessions: {message.TotalSessions}</li>
        </ul>
    </div>
    
    <div style='margin: 30px 0; text-align: center;'>
        <a href='https://skillswap.app/matches/{message.MatchId}' 
           style='display: inline-block; padding: 12px 30px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;'>
            Match-Details anzeigen
        </a>
    </div>
    
    <p style='color: #666; font-size: 14px;'>
        Ein Termin für eure erste Session wird automatisch erstellt. Du erhältst eine weitere Benachrichtigung mit den Termindetails.
    </p>
    
    <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>
    
    <p style='color: #999; font-size: 12px;'>
        © 2024 SkillSwap - Tausche Wissen, erweitere Horizonte
    </p>
</div>";
    }
}