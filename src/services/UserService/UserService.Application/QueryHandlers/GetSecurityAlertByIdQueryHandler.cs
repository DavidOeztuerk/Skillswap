using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using Contracts.Admin.Responses;
using UserService.Application.Queries;
using Infrastructure.Security.Monitoring;
using Core.Common.Exceptions;

namespace UserService.Application.QueryHandlers;

public class GetSecurityAlertByIdQueryHandler(
    ISecurityAlertService securityAlertService,
    ILogger<GetSecurityAlertByIdQueryHandler> logger)
    : BaseQueryHandler<GetSecurityAlertByIdQuery, SecurityAlertResponse>(logger)
{
    private readonly ISecurityAlertService _securityAlertService = securityAlertService;

    public override async Task<ApiResponse<SecurityAlertResponse>> Handle(GetSecurityAlertByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var alert = await _securityAlertService.GetAlertByIdAsync(request.AlertId, cancellationToken);
            if (alert == null)
                return Error("Security alert not found", ErrorCodes.ResourceNotFound);

            var response = new SecurityAlertResponse
            {
                Id = alert.Id,
                Level = alert.Level.ToString(),
                Type = alert.Type.ToString(),
                Title = alert.Title,
                Message = alert.Message,
                UserId = alert.UserId,
                IPAddress = alert.IPAddress,
                UserAgent = alert.UserAgent,
                Endpoint = alert.Endpoint,
                Metadata = alert.Metadata,
                IsRead = alert.IsRead,
                ReadAt = alert.ReadAt,
                ReadByAdminId = alert.ReadByAdminId,
                IsDismissed = alert.IsDismissed,
                DismissedAt = alert.DismissedAt,
                DismissedByAdminId = alert.DismissedByAdminId,
                DismissalReason = alert.DismissalReason,
                OccurredAt = alert.OccurredAt,
                OccurrenceCount = alert.OccurrenceCount,
                LastOccurrenceAt = alert.LastOccurrenceAt,
                CreatedAt = alert.CreatedAt
            };

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting security alert {AlertId}", request.AlertId);
            return Error("Failed to retrieve security alert", ErrorCodes.InternalError);
        }
    }
}
