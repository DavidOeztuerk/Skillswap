using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using Contracts.Admin.Responses;
using UserService.Application.Queries;
using Infrastructure.Security.Monitoring;
using Core.Common.Exceptions;

namespace UserService.Application.QueryHandlers;

public class GetSecurityAlertStatisticsQueryHandler(
    ISecurityAlertService securityAlertService,
    ILogger<GetSecurityAlertStatisticsQueryHandler> logger)
    : BaseQueryHandler<GetSecurityAlertStatisticsQuery, SecurityAlertStatisticsResponse>(logger)
{
    private readonly ISecurityAlertService _securityAlertService = securityAlertService;

    public override async Task<ApiResponse<SecurityAlertStatisticsResponse>> Handle(GetSecurityAlertStatisticsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var stats = await _securityAlertService.GetAlertStatisticsAsync(request.From, request.To, cancellationToken);

            var response = new SecurityAlertStatisticsResponse
            {
                TotalAlerts = stats.TotalAlerts,
                CriticalAlerts = stats.CriticalAlerts,
                HighAlerts = stats.HighAlerts,
                MediumAlerts = stats.MediumAlerts,
                LowAlerts = stats.LowAlerts,
                InfoAlerts = stats.InfoAlerts,
                UnreadAlerts = stats.UnreadAlerts,
                ActiveAlerts = stats.ActiveAlerts,
                DismissedAlerts = stats.DismissedAlerts,
                LastCriticalAlertAt = stats.LastCriticalAlertAt,
                LastAlertAt = stats.LastAlertAt,
                AlertsByType = stats.AlertsByType.Select(a => new AlertTypeCountResponse
                {
                    Type = a.Type.ToString(),
                    Count = a.Count,
                    HighestSeverity = a.HighestSeverity.ToString()
                }).ToList(),
                Timeline = stats.Timeline.Select(t => new AlertTimelinePointResponse
                {
                    Date = t.Date,
                    Critical = t.Critical,
                    High = t.High,
                    Medium = t.Medium,
                    Low = t.Low,
                    Info = t.Info
                }).ToList()
            };

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting security alert statistics");
            return Error("Failed to retrieve security alert statistics", ErrorCodes.InternalError);
        }
    }
}
