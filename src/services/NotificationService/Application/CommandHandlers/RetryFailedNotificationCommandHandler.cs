using Contracts.Notification.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using System.Text.Json;

namespace NotificationService.Application.CommandHandlers;

public class RetryFailedNotificationCommandHandler(
    NotificationDbContext context,
    ILogger<RetryFailedNotificationCommandHandler> logger)
        : BaseCommandHandler<RetryFailedNotificationCommand, RetryFailedNotificationResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<RetryFailedNotificationResponse>> Handle(RetryFailedNotificationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == request.NotificationId && !n.IsDeleted, cancellationToken);

            if (notification == null)
            {
                throw new InvalidOperationException("Notification not found");
            }

            if (notification.Status != NotificationStatus.Failed)
            {
                throw new InvalidOperationException("Can only retry failed notifications");
            }

            if (notification.RetryCount >= 5)
            {
                throw new InvalidOperationException("Maximum retry attempts reached");
            }

            // Update notification for retry
            notification.Status = NotificationStatus.Pending;
            notification.ErrorMessage = null;
            notification.NextRetryAt = null;
            notification.UpdatedAt = DateTime.UtcNow;

            // Update recipient if provided
            if (!string.IsNullOrEmpty(request.NewRecipient))
            {
                notification.Recipient = request.NewRecipient;
            }

            // Update variables if provided
            if (request.UpdatedVariables != null && request.UpdatedVariables.Any())
            {
                var metadata = string.IsNullOrEmpty(notification.MetadataJson)
                    ? new NotificationMetadata()
                    : JsonSerializer.Deserialize<NotificationMetadata>(notification.MetadataJson) ?? new NotificationMetadata();

                foreach (var variable in request.UpdatedVariables)
                {
                    metadata.Variables[variable.Key] = variable.Value;
                }

                notification.MetadataJson = JsonSerializer.Serialize(metadata);
                notification.Content = GetContentFromTemplate(notification.Template, metadata.Variables);
            }

            // Log retry event
            var notificationEvent = new NotificationEvent
            {
                NotificationId = request.NotificationId,
                EventType = NotificationEventTypes.Retry,
                Details = $"Manual retry initiated. Attempt #{notification.RetryCount + 1}",
                Timestamp = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.NotificationEvents.Add(notificationEvent);
            await _context.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Notification {NotificationId} queued for retry. Attempt #{RetryCount}",
                request.NotificationId, notification.RetryCount + 1);

            return Success(new RetryFailedNotificationResponse(
                request.NotificationId,
                notification.NextRetryAt != null,
                notification.Status,
                ""));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrying notification {NotificationId}", request.NotificationId);
            return Error("Error retrying notification: " + ex.Message);
        }
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
