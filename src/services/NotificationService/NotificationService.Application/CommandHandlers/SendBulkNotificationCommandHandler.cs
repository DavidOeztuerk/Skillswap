using Contracts.Notification.Responses;
using Microsoft.Extensions.Logging;
using CQRS.Handlers;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using System.Text.Json;
using Core.Common.Exceptions;

namespace NotificationService.Application.CommandHandlers;

public class SendBulkNotificationCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<SendBulkNotificationCommandHandler> logger)
    : BaseCommandHandler<SendBulkNotificationCommand, SendBulkNotificationResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<SendBulkNotificationResponse>> Handle(
        SendBulkNotificationCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var campaignId = Guid.NewGuid().ToString();
            var notificationIds = new List<string>();
            var now = DateTime.UtcNow;

            var campaign = new NotificationCampaign
            {
                Id = campaignId,
                Name = $"Bulk {request.Type} - {now:yyyy-MM-dd HH:mm}",
                Type = request.Type,
                Template = request.Template,
                Status = CampaignStatus.Running,
                TotalTargets = request.UserIds.Count,
                VariablesJson = JsonSerializer.Serialize(request.GlobalVariables),
                StartedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _unitOfWork.NotificationCampaigns.CreateAsync(campaign, cancellationToken);

            foreach (var userId in request.UserIds)
            {
                var notificationId = Guid.NewGuid().ToString();
                notificationIds.Add(notificationId);

                var vars = new Dictionary<string, string>(request.GlobalVariables);
                if (request.UserSpecificVariables?.TryGetValue(userId, out var userVars) == true)
                {
                    foreach (var kv in userVars)
                        vars[kv.Key] = kv.Value;
                }

                var metadata = new NotificationMetadata
                {
                    Variables = vars,
                    SourceEvent = "BulkCampaign",
                    CustomData = new Dictionary<string, object> { ["CampaignId"] = campaignId }
                };

                var isScheduled = request.ScheduledAt.HasValue && request.ScheduledAt > now;

                var notification = new Notification
                {
                    Id = notificationId,
                    UserId = userId,
                    Type = request.Type,
                    Template = request.Template,
                    Recipient = "placeholder@example.com",
                    Subject = GetSubjectFromTemplate(request.Template, vars),
                    Content = GetContentFromTemplate(request.Template, vars),
                    Status = isScheduled ? NotificationStatus.Pending : NotificationStatus.Sent,
                    Priority = request.Priority,
                    MetadataJson = JsonSerializer.Serialize(metadata),
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await _unitOfWork.Notifications.AddAsync(notification, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation(
                "Bulk notification campaign {CampaignId} created with {Count} notifications",
                campaignId, notificationIds.Count);

            return Success(new SendBulkNotificationResponse(
                campaignId,
                notificationIds.Count,
                0,
                notificationIds.Count,
                now));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating bulk notification campaign");
            return Error("Error creating bulk notification campaign: " + ex.Message, ErrorCodes.InternalError);
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
