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

                // Note: Subject and Content are intentionally left empty
                // so that NotificationOrchestrator loads the template from the database
                var notification = new Notification
                {
                    Id = notificationId,
                    UserId = userId,
                    Type = request.Type,
                    Template = request.Template,
                    Recipient = "placeholder@example.com",
                    Subject = string.Empty, // Will be loaded from template
                    Content = string.Empty, // Will be loaded from template
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
}
