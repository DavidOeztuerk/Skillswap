using CQRS.Handlers;
using CQRS.Models;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Queries;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.QueryHandlers;

public class GetNotificationStatisticsQueryHandler(
    NotificationDbContext context,
    ILogger<GetNotificationStatisticsQueryHandler> logger)
    : BaseQueryHandler<GetNotificationStatisticsQuery, NotificationStatisticsResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<NotificationStatisticsResponse>> Handle(
        GetNotificationStatisticsQuery request,
        CancellationToken cancellationToken)
    {
        var startDate = request.StartDate ?? DateTime.UtcNow.AddDays(-30);
        var endDate = request.EndDate ?? DateTime.UtcNow;

        var query = _context.Notifications
            .AsNoTracking() // Performance: Read-only query
            .Where(n => n.CreatedAt >= startDate && n.CreatedAt <= endDate && !n.IsDeleted);

        // Apply filters
        if (!string.IsNullOrEmpty(request.Type))
        {
            query = query.Where(n => n.Type == request.Type);
        }

        if (!string.IsNullOrEmpty(request.Template))
        {
            query = query.Where(n => n.Template == request.Template);
        }

        // Get basic statistics
        var totalNotifications = await query.CountAsync(cancellationToken);
        var sentNotifications = await query.CountAsync(n => n.Status == Domain.Entities.NotificationStatus.Sent, cancellationToken);
        var deliveredNotifications = await query.CountAsync(n => n.Status == Domain.Entities.NotificationStatus.Delivered, cancellationToken);
        var failedNotifications = await query.CountAsync(n => n.Status == Domain.Entities.NotificationStatus.Failed, cancellationToken);
        var pendingNotifications = await query.CountAsync(n => n.Status == Domain.Entities.NotificationStatus.Pending, cancellationToken);

        // Get statistics by type
        var byType = await query
            .GroupBy(n => n.Type)
            .Select(g => new NotificationStatsByType
            {
                Type = g.Key,
                Total = g.Count(),
                Sent = g.Count(n => n.Status == Domain.Entities.NotificationStatus.Sent),
                Failed = g.Count(n => n.Status == Domain.Entities.NotificationStatus.Failed)
            })
            .ToListAsync(cancellationToken);

        // Get statistics by template
        var byTemplate = await query
            .GroupBy(n => n.Template)
            .Select(g => new NotificationStatsByTemplate
            {
                Template = g.Key,
                Total = g.Count(),
                Sent = g.Count(n => n.Status == Domain.Entities.NotificationStatus.Sent),
                Failed = g.Count(n => n.Status == Domain.Entities.NotificationStatus.Failed)
            })
            .OrderByDescending(s => s.Total)
            .Take(10)
            .ToListAsync(cancellationToken);

        // Get daily statistics for the period
        var dailyStats = await query
            .GroupBy(n => n.CreatedAt.Date)
            .Select(g => new DailyNotificationStats
            {
                Date = g.Key,
                Total = g.Count(),
                Sent = g.Count(n => n.Status == Domain.Entities.NotificationStatus.Sent),
                Failed = g.Count(n => n.Status == Domain.Entities.NotificationStatus.Failed)
            })
            .OrderBy(s => s.Date)
            .ToListAsync(cancellationToken);

        var successRate = totalNotifications > 0
            ? Math.Round((double)(sentNotifications + deliveredNotifications) / totalNotifications * 100, 2)
            : 0;

        var failureRate = totalNotifications > 0
            ? Math.Round((double)failedNotifications / totalNotifications * 100, 2)
            : 0;

        return Success(new NotificationStatisticsResponse
        {
            Period = new PeriodStats
            {
                StartDate = startDate,
                EndDate = endDate,
                TotalDays = (int)(endDate - startDate).TotalDays + 1
            },
            Overview = new OverviewStats
            {
                TotalNotifications = totalNotifications,
                SentNotifications = sentNotifications,
                DeliveredNotifications = deliveredNotifications,
                FailedNotifications = failedNotifications,
                PendingNotifications = pendingNotifications,
                SuccessRate = successRate,
                FailureRate = failureRate
            },
            ByType = byType,
            ByTemplate = byTemplate,
            DailyStats = dailyStats,
            GeneratedAt = DateTime.UtcNow
        });
    }
}
