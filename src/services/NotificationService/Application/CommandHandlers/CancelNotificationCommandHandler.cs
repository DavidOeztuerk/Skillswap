// ============================================================================
// CANCEL NOTIFICATION COMMAND HANDLER
// ============================================================================

using CQRS.Handlers;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Application.CommandHandlers;

public class CancelNotificationCommandHandler(
    NotificationDbContext context,
    ILogger<CancelNotificationCommandHandler> logger)
    : BaseCommandHandler<CancelNotificationCommand, CancelNotificationResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<CancelNotificationResponse>> Handle(CancelNotificationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == request.NotificationId && !n.IsDeleted, cancellationToken);

            if (notification == null)
            {
                return Success(new CancelNotificationResponse(
                    request.NotificationId,
                    false,
                    "Notification not found"));
            }

            if (notification.Status == NotificationStatus.Sent || notification.Status == NotificationStatus.Delivered)
            {
                return Success(new CancelNotificationResponse(
                    request.NotificationId,
                    false,
                    "Cannot cancel notification that has already been sent"));
            }

            notification.Status = NotificationStatus.Cancelled;
            notification.UpdatedAt = DateTime.UtcNow;

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

            _context.NotificationEvents.Add(notificationEvent);
            await _context.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Notification {NotificationId} cancelled. Reason: {Reason}",
                request.NotificationId, request.Reason);

            return Success(new CancelNotificationResponse(
                request.NotificationId,
                true,
                "Notification cancelled successfully"));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error cancelling notification {NotificationId}", request.NotificationId);
            return Error($"Error cancelling notification {request.NotificationId}: {ex.Message}");
        }
    }
}
