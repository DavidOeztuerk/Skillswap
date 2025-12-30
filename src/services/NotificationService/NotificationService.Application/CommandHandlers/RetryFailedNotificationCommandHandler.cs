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

public class RetryFailedNotificationCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<RetryFailedNotificationCommandHandler> logger)
    : BaseCommandHandler<RetryFailedNotificationCommand, RetryFailedNotificationResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<RetryFailedNotificationResponse>> Handle(
        RetryFailedNotificationCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var notification = await _unitOfWork.Notifications.GetByIdAsync(request.NotificationId, cancellationToken);

            if (notification == null || notification.IsDeleted)
            {
                throw new System.InvalidOperationException("Notification not found");
            }

            if (notification.Status != NotificationStatus.Failed)
            {
                throw new System.InvalidOperationException("Can only retry failed notifications");
            }

            if (notification.RetryCount >= 5)
            {
                throw new System.InvalidOperationException("Maximum retry attempts reached");
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
                // Leave Content empty so NotificationOrchestrator loads template from DB
                notification.Content = string.Empty;
            }

            await _unitOfWork.Notifications.UpdateAsync(notification, cancellationToken);

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

            await _unitOfWork.NotificationEvents.CreateAsync(notificationEvent, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

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
            return Error("Error retrying notification: " + ex.Message, ErrorCodes.InternalError);
        }
    }

}
