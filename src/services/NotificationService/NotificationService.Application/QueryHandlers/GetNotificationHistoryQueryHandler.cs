using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using NotificationService.Application.Queries;
using NotificationService.Domain.ResponseModels;
using NotificationService.Domain.Repositories;
using Core.Common.Exceptions;

namespace NotificationService.Application.QueryHandlers;

public class GetNotificationHistoryQueryHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<GetNotificationHistoryQueryHandler> logger)
    : BasePagedQueryHandler<GetNotificationHistoryQuery, NotificationHistoryResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<PagedResponse<NotificationHistoryResponse>> Handle(
        GetNotificationHistoryQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get notifications with large page size to get all user notifications
            var notifications = await _unitOfWork.Notifications
                .GetByUserIdAsync(request.UserId, 1, 10000, cancellationToken);

            // Apply filters
            if (!string.IsNullOrEmpty(request.Type))
            {
                notifications = notifications.Where(n => n.Type == request.Type).ToList();
            }

            if (!string.IsNullOrEmpty(request.Status))
            {
                notifications = notifications.Where(n => n.Status == request.Status).ToList();
            }

            if (request.StartDate.HasValue)
            {
                notifications = notifications.Where(n => n.CreatedAt >= request.StartDate.Value).ToList();
            }

            if (request.EndDate.HasValue)
            {
                notifications = notifications.Where(n => n.CreatedAt <= request.EndDate.Value).ToList();
            }

            // Get total count
            var totalCount = notifications.Count;

            // Apply pagination and get notifications
            var pagedNotifications = notifications
                .OrderByDescending(n => n.CreatedAt)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(n => new NotificationHistoryResponse
                {
                    Id = n.Id,
                    Type = n.Type,
                    Template = n.Template,
                    Subject = n.Subject,
                    Status = n.Status,
                    Priority = n.Priority,
                    CreatedAt = n.CreatedAt,
                    SentAt = n.SentAt,
                    DeliveredAt = n.DeliveredAt,
                    ReadAt = n.ReadAt,
                    RetryCount = n.RetryCount,
                    ErrorMessage = n.ErrorMessage
                })
                .ToList();

            return Success(pagedNotifications, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving notification history for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving notification history", ErrorCodes.InternalError);
        }
    }
}
