using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using Infrastructure.Security.Monitoring;
using Core.Common.Exceptions;
using Contracts.Admin.Responses;

namespace UserService.Application.CommandHandlers;

public class DismissSecurityAlertCommandHandler(
    ISecurityAlertService securityAlertService,
    ILogger<DismissSecurityAlertCommandHandler> logger)
    : BaseCommandHandler<DismissSecurityAlertCommand, SecurityAlertActionResponse>(logger)
{
    private readonly ISecurityAlertService _securityAlertService = securityAlertService;

    public override async Task<ApiResponse<SecurityAlertActionResponse>> Handle(DismissSecurityAlertCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _securityAlertService.DismissAlertAsync(request.AlertId, request.AdminUserId, request.Reason, cancellationToken);

            var response = new SecurityAlertActionResponse
            {
                AlertId = request.AlertId,
                Action = "Dismissed",
                AdminUserId = request.AdminUserId,
                ActionAt = DateTime.UtcNow,
                Reason = request.Reason,
                Success = true,
                Message = "Security alert dismissed successfully"
            };

            return Success(response, "Security alert dismissed successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error dismissing security alert {AlertId}", request.AlertId);
            return Error("Failed to dismiss security alert", ErrorCodes.InternalError);
        }
    }
}
