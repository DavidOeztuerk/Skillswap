using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using NotificationService.Application.Queries;
using NotificationService.Domain.ResponseModels;
using NotificationService.Domain.Repositories;
using NotificationService.Domain.Entities;

namespace NotificationService.Application.QueryHandlers;

public class GetNotificationStatisticsQueryHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<GetNotificationStatisticsQueryHandler> logger)
    : BaseQueryHandler<GetNotificationStatisticsQuery, NotificationStatisticsResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<NotificationStatisticsResponse>> Handle(
        GetNotificationStatisticsQuery request,
        CancellationToken cancellationToken)
    {
        var startDate = request.StartDate ?? DateTime.UtcNow.AddDays(-30);
        var endDate = request.EndDate ?? DateTime.UtcNow;

        // Simplified implementation - return basic statistics
        // TODO: Implement GetNotificationStatisticsAsync in repository for full statistics
        var pendingNotifications = await _unitOfWork.Notifications.GetPendingNotificationsAsync(cancellationToken);
        var failedNotifications = await _unitOfWork.Notifications.GetFailedNotificationsAsync(cancellationToken);

        var totalNotifications = pendingNotifications.Count + failedNotifications.Count;
        var successRate = totalNotifications > 0 ? 100.0 - (failedNotifications.Count * 100.0 / totalNotifications) : 100.0;

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
                SentNotifications = 0,
                DeliveredNotifications = 0,
                FailedNotifications = failedNotifications.Count,
                PendingNotifications = pendingNotifications.Count,
                SuccessRate = Math.Round(successRate, 2),
                FailureRate = Math.Round(100.0 - successRate, 2)
            },
            ByType = new List<NotificationStatsByType>(),
            ByTemplate = new List<NotificationStatsByTemplate>(),
            DailyStats = new List<DailyNotificationStats>(),
            GeneratedAt = DateTime.UtcNow
        });
    }
}
