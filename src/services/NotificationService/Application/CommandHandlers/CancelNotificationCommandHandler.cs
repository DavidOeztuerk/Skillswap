using Contracts.Notification.Responses;
using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;

namespace NotificationService.Application.CommandHandlers;

public class CancelNotificationCommandHandler(
    NotificationDbContext context,
    ILogger<CancelNotificationCommandHandler> logger)
    : BaseCommandHandler<CancelNotificationCommand, CancelNotificationResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<CancelNotificationResponse>> Handle(CancelNotificationCommand request, CancellationToken cancellationToken)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && !n.IsDeleted, cancellationToken);

        if (notification == null)
        {
            throw new ResourceNotFoundException("Notification", request.NotificationId.ToString());
        }

        if (notification.Status == NotificationStatus.Sent || notification.Status == NotificationStatus.Delivered)
        {
            throw new System.InvalidOperationException("Cannot cancel notification that has already been sent");
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
            notification.UpdatedAt ?? DateTime.UtcNow,
            "Notification cancelled successfully"));
    }
}
