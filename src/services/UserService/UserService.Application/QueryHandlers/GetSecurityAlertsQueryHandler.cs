using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using Contracts.Admin.Responses;
using UserService.Application.Queries;
using Infrastructure.Security.Monitoring;
using Core.Common.Exceptions;

namespace UserService.Application.QueryHandlers;

public class GetSecurityAlertsQueryHandler(
    ISecurityAlertService securityAlertService,
    ILogger<GetSecurityAlertsQueryHandler> logger)
    : BasePagedQueryHandler<GetSecurityAlertsQuery, SecurityAlertResponse>(logger)
{
    private readonly ISecurityAlertService _securityAlertService = securityAlertService;

    public override async Task<PagedResponse<SecurityAlertResponse>> Handle(GetSecurityAlertsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            SecurityAlertLevel? minLevel = null;
            if (!string.IsNullOrEmpty(request.MinLevel))
            {
                minLevel = Enum.Parse<SecurityAlertLevel>(request.MinLevel);
            }

            SecurityAlertType? type = null;
            if (!string.IsNullOrEmpty(request.Type))
            {
                type = Enum.Parse<SecurityAlertType>(request.Type);
            }

            var (alerts, totalCount) = await _securityAlertService.GetRecentAlertsAsync(
                request.PageNumber,
                request.PageSize,
                minLevel,
                type,
                request.IncludeRead,
                request.IncludeDismissed,
                cancellationToken);

            // Ensure alerts is never null (defensive programming)
            var alertList = alerts ?? new List<SecurityAlert>();

            var responses = alertList.Select(a => new SecurityAlertResponse
            {
                Id = a.Id,
                Level = a.Level.ToString(),
                Type = a.Type.ToString(),
                Title = a.Title,
                Message = a.Message,
                UserId = a.UserId,
                IPAddress = a.IPAddress,
                UserAgent = a.UserAgent,
                Endpoint = a.Endpoint,
                Metadata = a.Metadata,
                IsRead = a.IsRead,
                ReadAt = a.ReadAt,
                ReadByAdminId = a.ReadByAdminId,
                IsDismissed = a.IsDismissed,
                DismissedAt = a.DismissedAt,
                DismissedByAdminId = a.DismissedByAdminId,
                DismissalReason = a.DismissalReason,
                OccurredAt = a.OccurredAt,
                OccurrenceCount = a.OccurrenceCount,
                LastOccurrenceAt = a.LastOccurrenceAt,
                CreatedAt = a.CreatedAt
            }).ToList();

            return Success(responses, totalCount, request.PageNumber, request.PageSize);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting security alerts");
            return Error("Failed to retrieve security alerts", ErrorCodes.InternalError);
        }
    }
}
