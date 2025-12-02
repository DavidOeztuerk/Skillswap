using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using Infrastructure.Security.Monitoring;
using Core.Common.Exceptions;
using Contracts.Admin.Responses;

namespace UserService.Application.CommandHandlers;

public class MarkAlertAsReadCommandHandler(
    ISecurityAlertService securityAlertService,
    ILogger<MarkAlertAsReadCommandHandler> logger)
    : BaseCommandHandler<MarkAlertAsReadCommand, SecurityAlertActionResponse>(logger)
{
    private readonly ISecurityAlertService _securityAlertService = securityAlertService;

    public override async Task<ApiResponse<SecurityAlertActionResponse>> Handle(MarkAlertAsReadCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _securityAlertService.MarkAlertAsReadAsync(request.AlertId, request.AdminUserId, cancellationToken);

            var response = new SecurityAlertActionResponse
            {
                AlertId = request.AlertId,
                Action = "MarkedAsRead",
                AdminUserId = request.AdminUserId,
                ActionAt = DateTime.UtcNow,
                Reason = null,
                Success = true,
                Message = "Security alert marked as read"
            };

            return Success(response, "Security alert marked as read");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error marking alert as read {AlertId}", request.AlertId);
            return Error("Failed to mark alert as read", ErrorCodes.InternalError);
        }
    }
}
