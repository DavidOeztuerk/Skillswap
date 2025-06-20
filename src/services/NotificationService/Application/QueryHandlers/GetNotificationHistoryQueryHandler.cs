// ============================================================================
// QUERY HANDLERS
// ============================================================================

using CQRS.Handlers;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Queries;
using NotificationService.Domain.ResponseModels;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Application.QueryHandlers;

public class GetNotificationHistoryQueryHandler(
    NotificationDbContext context,
    ILogger<GetNotificationHistoryQueryHandler> logger)
    : BasePagedQueryHandler<GetNotificationHistoryQuery, NotificationHistoryResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<PagedResponse<NotificationHistoryResponse>> Handle(
        GetNotificationHistoryQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.Notifications
                .Where(n => n.UserId == request.UserId && !n.IsDeleted);

            // Apply filters
            if (!string.IsNullOrEmpty(request.Type))
            {
                query = query.Where(n => n.Type == request.Type);
            }

            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(n => n.Status == request.Status);
            }

            if (request.StartDate.HasValue)
            {
                query = query.Where(n => n.CreatedAt >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue)
            {
                query = query.Where(n => n.CreatedAt <= request.EndDate.Value);
            }

            // Get total count
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply pagination and get notifications
            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
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
                .ToListAsync(cancellationToken);

            return Success(notifications, request.Page, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving notification history for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving notification history");
        }
    }
}