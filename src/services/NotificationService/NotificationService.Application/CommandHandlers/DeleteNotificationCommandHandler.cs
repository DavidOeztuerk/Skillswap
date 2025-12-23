using Contracts.Notification.Responses;
using Microsoft.Extensions.Logging;
using CQRS.Handlers;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using Core.Common.Exceptions;

namespace NotificationService.Application.CommandHandlers;

public class DeleteNotificationCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<DeleteNotificationCommandHandler> logger)
    : BaseCommandHandler<DeleteNotificationCommand, DeleteNotificationResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<DeleteNotificationResponse>> Handle(
        DeleteNotificationCommand request,
        CancellationToken cancellationToken)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(request.NotificationId, cancellationToken);

        if (notification == null || notification.UserId != request.UserId || notification.IsDeleted)
        {
            throw new ResourceNotFoundException("Notification", request.NotificationId);
        }

        var deletedAt = DateTime.UtcNow;
        notification.IsDeleted = true;
        notification.UpdatedAt = deletedAt;

        await _unitOfWork.Notifications.UpdateAsync(notification, cancellationToken);

        // Log deletion event
        var notificationEvent = new NotificationEvent
        {
            NotificationId = request.NotificationId,
            EventType = NotificationEventTypes.Deleted,
            Details = $"Notification deleted by user {request.UserId}",
            Timestamp = deletedAt,
            CreatedAt = deletedAt,
            UpdatedAt = deletedAt
        };

        await _unitOfWork.NotificationEvents.CreateAsync(notificationEvent, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Notification {NotificationId} deleted by user {UserId}",
            request.NotificationId, request.UserId);

        return Success(new DeleteNotificationResponse(
            request.NotificationId,
            deletedAt,
            "Notification deleted successfully"));
    }
}
