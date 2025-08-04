using CQRS.Handlers;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using System.Text.Json;

namespace NotificationService.Application.CommandHandlers;

public class SendBulkNotificationCommandHandler(
    NotificationDbContext context,
    ILogger<SendBulkNotificationCommandHandler> logger)
    : BaseCommandHandler<SendBulkNotificationCommand, SendBulkNotificationResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<SendBulkNotificationResponse>> Handle(
        SendBulkNotificationCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var campaignId = Guid.NewGuid().ToString();
            var notificationIds = new List<string>();

            // Create campaign record
            var campaign = new NotificationCampaign
            {
                Id = campaignId,
                Name = $"Bulk {request.Type} - {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                Type = request.Type,
                Template = request.Template,
                Status = CampaignStatus.Running,
                TotalTargets = request.UserIds.Count,
                VariablesJson = JsonSerializer.Serialize(request.GlobalVariables),
                StartedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.NotificationCampaigns.Add(campaign);

            // Create individual notifications
            foreach (var userId in request.UserIds)
            {
                var notificationId = Guid.NewGuid().ToString();
                notificationIds.Add(notificationId);

                // Merge global and user-specific variables
                var variables = new Dictionary<string, string>(request.GlobalVariables);
                if (request.UserSpecificVariables?.ContainsKey(userId) == true)
                {
                    foreach (var userVar in request.UserSpecificVariables[userId])
                    {
                        variables[userVar.Key] = userVar.Value;
                    }
                }

                var metadata = new NotificationMetadata
                {
                    Variables = variables,
                    SourceEvent = "BulkCampaign",
                    CustomData = new Dictionary<string, object> { ["CampaignId"] = campaignId }
                };

                var notification = new Notification
                {
                    Id = notificationId,
                    UserId = userId,
                    Type = request.Type,
                    Template = request.Template,
                    Recipient = "placeholder@example.com", // Would need to lookup actual email
                    Subject = GetSubjectFromTemplate(request.Template, variables),
                    Content = GetContentFromTemplate(request.Template, variables),
                    Status = request.ScheduledAt.HasValue && request.ScheduledAt > DateTime.UtcNow
                        ? NotificationStatus.Pending
                        : NotificationStatus.Pending,
                    Priority = request.Priority,
                    MetadataJson = JsonSerializer.Serialize(metadata),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
            }

            await _context.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Bulk notification campaign {CampaignId} created with {Count} notifications",
                campaignId, notificationIds.Count);

            return Success(new SendBulkNotificationResponse(
                campaignId,
                notificationIds.Count,
                notificationIds));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating bulk notification campaign");
            return Error("Error creating bulk notification campaign: " + ex.Message);
        }
    }

    private static string GetSubjectFromTemplate(string template, Dictionary<string, string> variables)
    {
        // Same logic as SendNotificationCommandHandler
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
