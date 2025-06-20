// ============================================================================
// MARK NOTIFICATION AS READ COMMAND HANDLER
// ============================================================================

using CQRS.Handlers;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Application.CommandHandlers;

public class MarkNotificationAsReadCommandHandler(
    NotificationDbContext context,
    ILogger<MarkNotificationAsReadCommandHandler> logger)
    : BaseCommandHandler<MarkNotificationAsReadCommand, MarkNotificationAsReadResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<MarkNotificationAsReadResponse>> Handle(
        MarkNotificationAsReadCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == request.NotificationId
                                         && n.UserId == request.UserId
                                         && !n.IsDeleted, cancellationToken);

            if (notification == null)
            {
                throw new InvalidOperationException("Notification not found or access denied");
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

            _context.NotificationEvents.Add(notificationEvent);
            await _context.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Notification {NotificationId} marked as read by user {UserId}",
                request.NotificationId, request.UserId);

            return Success(
                   new MarkNotificationAsReadResponse(
                       request.NotificationId,
                       notification.ReadAt.Value));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error marking notification {NotificationId} as read for user {UserId}",
                request.NotificationId, request.UserId);
            return Error("Error marking notification as read: " + ex.Message);
        }
    }
}
