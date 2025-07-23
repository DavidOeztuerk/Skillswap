// ============================================================================
// MARK ALL NOTIFICATIONS AS READ COMMAND HANDLER
// ============================================================================

using CQRS.Handlers;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Application.CommandHandlers;

public class MarkAllNotificationsAsReadCommandHandler(
    NotificationDbContext context,
    ILogger<MarkAllNotificationsAsReadCommandHandler> logger)
    : BaseCommandHandler<MarkAllNotificationsAsReadCommand, MarkAllNotificationsAsReadResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<MarkAllNotificationsAsReadResponse>> Handle(
        MarkAllNotificationsAsReadCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var readAt = DateTime.UtcNow;

            // Get all unread notifications for the user
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == request.UserId 
                           && !n.ReadAt.HasValue 
                           && !n.IsDeleted)
                .ToListAsync(cancellationToken);

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
            }

            await _context.SaveChangesAsync(cancellationToken);

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
            return Error("Failed to mark all notifications as read");
        }
    }
}