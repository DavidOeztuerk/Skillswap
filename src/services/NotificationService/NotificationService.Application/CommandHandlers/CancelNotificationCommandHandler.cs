using Contracts.Notification.Responses;
using Microsoft.Extensions.Logging;
using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.CommandHandlers;

public class CancelNotificationCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<CancelNotificationCommandHandler> logger)
    : BaseCommandHandler<CancelNotificationCommand, CancelNotificationResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<CancelNotificationResponse>> Handle(
        CancelNotificationCommand request,
        CancellationToken cancellationToken)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(request.NotificationId, cancellationToken);

        if (notification == null || notification.IsDeleted)
        {
            throw new ResourceNotFoundException("Notification", request.NotificationId.ToString());
        }

        if (notification.Status == NotificationStatus.Sent || notification.Status == NotificationStatus.Delivered)
        {
            throw new System.InvalidOperationException("Cannot cancel notification that has already been sent");
        }

        notification.Status = NotificationStatus.Cancelled;
        notification.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Notifications.UpdateAsync(notification, cancellationToken);

        // Log cancellation event
        var notificationEvent = new NotificationEvent
        {
            NotificationId = request.NotificationId,
            EventType = NotificationEventTypes.Cancelled,
            Details = $"Cancelled by user. Reason: {request.Reason}",
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.NotificationEvents.CreateAsync(notificationEvent, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Notification {NotificationId} cancelled. Reason: {Reason}",
            request.NotificationId, request.Reason);

        return Success(new CancelNotificationResponse(
            request.NotificationId,
            notification.UpdatedAt ?? DateTime.UtcNow,
            "Notification cancelled successfully"));
    }
}
