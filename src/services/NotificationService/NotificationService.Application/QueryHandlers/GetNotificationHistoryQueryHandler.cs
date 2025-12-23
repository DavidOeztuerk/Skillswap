using System.Text.Json;
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
                .Select(n =>
                {
                    var metadata = DeserializeMetadata(n.MetadataJson);
                    return new NotificationHistoryResponse
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
                        ErrorMessage = n.ErrorMessage,
                        // Frontend-compatible fields
                        Title = n.Subject,
                        Message = n.Content ?? "",
                        IsRead = n.ReadAt.HasValue,
                        ActionUrl = ExtractActionUrl(metadata),
                        Metadata = metadata
                    };
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

    private static Dictionary<string, object>? DeserializeMetadata(string? metadataJson)
    {
        if (string.IsNullOrEmpty(metadataJson))
            return null;

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(metadataJson);
        }
        catch
        {
            return null;
        }
    }

    private static string? ExtractActionUrl(Dictionary<string, object>? metadata)
    {
        if (metadata == null)
            return null;

        // Try common action URL keys
        string[] actionUrlKeys = ["ActionUrl", "actionUrl", "Url", "url", "Link", "link"];
        foreach (var key in actionUrlKeys)
        {
            if (metadata.TryGetValue(key, out var value) && value is JsonElement element)
            {
                return element.GetString();
            }
            if (metadata.TryGetValue(key, out var stringValue) && stringValue is string url)
            {
                return url;
            }
        }

        // Build action URL from common metadata patterns
        // Match requests - use ThreadId for timeline view
        if (metadata.TryGetValue("ThreadId", out var threadId))
        {
            var threadIdStr = threadId is JsonElement threadElement ? threadElement.GetString() : threadId?.ToString();
            if (!string.IsNullOrEmpty(threadIdStr))
                return $"/matchmaking/timeline/{threadIdStr}";
        }

        // Appointments
        if (metadata.TryGetValue("AppointmentId", out var appointmentId))
        {
            var appointmentIdStr = appointmentId is JsonElement appElement ? appElement.GetString() : appointmentId?.ToString();
            if (!string.IsNullOrEmpty(appointmentIdStr))
                return $"/appointments/{appointmentIdStr}";
        }

        // Matches
        if (metadata.TryGetValue("MatchId", out var matchId))
        {
            var matchIdStr = matchId is JsonElement matchElement ? matchElement.GetString() : matchId?.ToString();
            if (!string.IsNullOrEmpty(matchIdStr))
                return $"/matchmaking/{matchIdStr}";
        }

        // Skills
        if (metadata.TryGetValue("SkillId", out var skillId))
        {
            var skillIdStr = skillId is JsonElement skillElement ? skillElement.GetString() : skillId?.ToString();
            if (!string.IsNullOrEmpty(skillIdStr))
                return $"/skills/{skillIdStr}";
        }

        return null;
    }
}
