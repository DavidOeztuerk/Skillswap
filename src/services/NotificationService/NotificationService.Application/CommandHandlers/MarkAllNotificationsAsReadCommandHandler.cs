using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using Core.Common.Exceptions;

namespace NotificationService.Application.CommandHandlers;

public class MarkAllNotificationsAsReadCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<MarkAllNotificationsAsReadCommandHandler> logger)
    : BaseCommandHandler<MarkAllNotificationsAsReadCommand, MarkAllNotificationsAsReadResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<MarkAllNotificationsAsReadResponse>> Handle(
        MarkAllNotificationsAsReadCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var readAt = DateTime.UtcNow;

            // Get all notifications for the user and filter for unread
            var allNotifications = await _unitOfWork.Notifications
                .GetByUserIdAsync(request.UserId, 1, 10000, cancellationToken);

            var unreadNotifications = allNotifications.Where(n => !n.ReadAt.HasValue).ToList();

            if (!unreadNotifications.Any())
            {
                // No unread notifications
                return Success(
                    new MarkAllNotificationsAsReadResponse(
                        request.UserId,
                        0,
                        readAt));
            }

            // Mark all as read
            foreach (var notification in unreadNotifications)
            {
                notification.ReadAt = readAt;
                notification.Status = NotificationStatus.Read;
                notification.UpdatedAt = readAt;

                await _unitOfWork.Notifications.UpdateAsync(notification, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation(
                "Marked {Count} notifications as read for user {UserId}",
                unreadNotifications.Count,
                request.UserId);

            return Success(
                new MarkAllNotificationsAsReadResponse(
                    request.UserId,
                    unreadNotifications.Count,
                    readAt));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex,
                "Error marking all notifications as read for user {UserId}",
                request.UserId);
            return Error("Failed to mark all notifications as read", ErrorCodes.InternalError);
        }
    }
}
