using Contracts.Notification.Responses;
using Microsoft.Extensions.Logging;
using CQRS.Handlers;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using Core.Common.Exceptions;

namespace NotificationService.Application.CommandHandlers;

public class MarkNotificationAsReadCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<MarkNotificationAsReadCommandHandler> logger)
    : BaseCommandHandler<MarkNotificationAsReadCommand, MarkNotificationAsReadResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<MarkNotificationAsReadResponse>> Handle(
        MarkNotificationAsReadCommand request,
        CancellationToken cancellationToken)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(request.NotificationId, cancellationToken);

        if (notification == null || notification.UserId != request.UserId || notification.IsDeleted)
        {
            throw new ResourceNotFoundException("Notification", request.NotificationId);
        }

        if (notification.ReadAt.HasValue)
        {
            // Already marked as read, return existing timestamp
            return Success(
                new MarkNotificationAsReadResponse(
                    request.NotificationId,
                    notification.ReadAt.Value));
        }

        notification.ReadAt = DateTime.UtcNow;
        notification.Status = NotificationStatus.Read;
        notification.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Notifications.UpdateAsync(notification, cancellationToken);

        // Log read event
        var notificationEvent = new NotificationEvent
        {
            NotificationId = request.NotificationId,
            EventType = NotificationEventTypes.Opened,
            Details = $"Notification marked as read by user {request.UserId}",
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.NotificationEvents.CreateAsync(notificationEvent, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Notification {NotificationId} marked as read by user {UserId}",
            request.NotificationId, request.UserId);

        return Success(
            new MarkNotificationAsReadResponse(
                request.NotificationId,
                notification.ReadAt.Value));
    }
}
