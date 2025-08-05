using Contracts.Notification.Responses;
using CQRS.Handlers;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using System.Text.Json;

namespace NotificationService.Application.CommandHandlers;

public class SendNotificationCommandHandler(
    NotificationDbContext context,
    ILogger<SendNotificationCommandHandler> logger)
    : BaseCommandHandler<SendNotificationCommand, SendNotificationResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<SendNotificationResponse>> Handle(
        SendNotificationCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var notificationId = Guid.NewGuid().ToString();

            var metadata = new NotificationMetadata
            {
                Variables = request.Variables,
                CorrelationId = request.CorrelationId,
                SourceEvent = "Manual",
                ExpiresAt = request.ScheduledAt?.AddDays(7) // Expire after 7 days if scheduled
            };

            var notification = new Notification
            {
                Id = notificationId,
                UserId = request.UserId ?? "system",
                Type = request.Type,
                Template = request.Template,
                Recipient = request.Recipient,
                Subject = GetSubjectFromTemplate(request.Template, request.Variables),
                Content = GetContentFromTemplate(request.Template, request.Variables),
                Status = request.ScheduledAt.HasValue && request.ScheduledAt > DateTime.UtcNow
                    ? NotificationStatus.Pending
                    : NotificationStatus.Pending,
                Priority = request.Priority,
                MetadataJson = JsonSerializer.Serialize(metadata),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync(cancellationToken);

            // Log creation event
            var notificationEvent = new NotificationEvent
            {
                NotificationId = notificationId,
                EventType = NotificationEventTypes.Queued,
                Details = $"Notification queued for {request.Type} delivery",
                Timestamp = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.NotificationEvents.Add(notificationEvent);
            await _context.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Notification {NotificationId} created and queued for delivery", notificationId);

            var response = new SendNotificationResponse(
                notificationId,
                notification.CreatedAt);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating notification for user {UserId}", request.UserId);
            return Error("Error creating notification: " + ex.Message);
        }
    }

    private static string GetSubjectFromTemplate(string template, Dictionary<string, string> variables)
    {
        return template switch
        {
            EmailTemplateNames.Welcome => "Welcome to SkillSwap! 🎉",
            EmailTemplateNames.EmailVerification => "Please verify your email address",
            EmailTemplateNames.PasswordReset => "Reset your SkillSwap password",
            EmailTemplateNames.PasswordChanged => "Your password has been changed",
            EmailTemplateNames.SecurityAlert => "Security Alert - Unusual activity detected",
            EmailTemplateNames.AccountSuspended => "Your account has been suspended",
            EmailTemplateNames.AccountReactivated => "Your account has been reactivated",
            EmailTemplateNames.SkillMatchFound => "New skill match found! 🚀",
            EmailTemplateNames.AppointmentReminder => "Reminder: Your skill session is soon",
            EmailTemplateNames.AppointmentConfirmation => "Your skill session has been confirmed",
            _ => "SkillSwap Notification"
        };
    }

    private static string GetContentFromTemplate(string template, Dictionary<string, string> variables)
    {
        var content = template switch
        {
            EmailTemplateNames.Welcome => "Welcome to SkillSwap! We're excited to have you join our community.",
            EmailTemplateNames.EmailVerification => $"Please verify your email address using the provided link.",
            EmailTemplateNames.PasswordReset => $"You requested to reset your password. Use the provided link to continue.",
            EmailTemplateNames.PasswordChanged => $"Your password was successfully changed at {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss UTC}.",
            EmailTemplateNames.SecurityAlert => $"Unusual activity was detected on your account.",
            _ => "SkillSwap notification"
        };

        // Simple variable replacement
        foreach (var variable in variables)
        {
            content = content.Replace($"{{{{{variable.Key}}}}}", variable.Value);
        }

        return content;
    }
}
