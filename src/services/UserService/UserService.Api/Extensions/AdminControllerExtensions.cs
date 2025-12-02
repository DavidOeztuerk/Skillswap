using Contracts.Admin.Requests;
using Contracts.Admin.Responses;
using CQRS.Extensions;
using CQRS.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Commands;
using UserService.Application.Queries;

namespace UserService.Api.Extensions;

public static class AdminControllerExtensions
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var adminGroup = app.MapGroup("/api/admin")
            .WithTags("Admin")
            .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin" });

        // Dashboard
        adminGroup.MapGet("/dashboard", async (
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new GetAdminDashboardQuery();
            return await mediator.SendQuery(query);
        })
        .WithName("GetAdminDashboard")
        .Produces<ApiResponse<AdminDashboardResponse>>(200);

        // User Management
        adminGroup.MapGet("/users", async (
            [FromQuery] int page,
            [FromQuery] int limit,
            [FromQuery] string? status,
            [FromQuery] string? role,
            [FromQuery] string? search,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new GetAdminUsersQuery
            {
                Status = status,
                Role = role,
                Search = search
            };

            return await mediator.SendQuery(query);
        })
        .WithName("GetAdminUsers")
        .Produces<PagedResponse<AdminUserResponse>>(200);

        adminGroup.MapGet("/users/{userId}", async (
            string userId,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new GetAdminUserByIdQuery { UserId = userId };
            return await mediator.SendQuery(query);
        })
        .WithName("GetAdminUserById")
        .Produces<ApiResponse<AdminUserResponse>>(200)
        .Produces(404);

        adminGroup.MapPut("/users/{userId}/role", async (
            string userId,
            [FromBody] UpdateUserRoleRequest request,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateUserRoleCommand
            {
                UserId = userId,
                Role = request.Role
            };
            return await mediator.SendCommand(command);
        })
        .WithName("UpdateUserRole")
        .Produces<ApiResponse<AdminUserResponse>>(200)
        .Produces(400);

        adminGroup.MapPost("/users/{userId}/suspend", async (
            string userId,
            [FromBody] SuspendUserRequest request,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = new SuspendUserCommand
            {
                UserId = userId,
                Reason = request.Reason
            };
            return await mediator.SendCommand(command);
        })
        .WithName("SuspendUser")
        .Produces<ApiResponse<AdminUserResponse>>(200)
        .Produces(400);

        adminGroup.MapPost("/users/{userId}/unsuspend", async (
            string userId,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = new UnsuspendUserCommand { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("UnsuspendUser")
        .Produces<ApiResponse<AdminUserResponse>>(200)
        .Produces(400);

        adminGroup.MapDelete("/users/{userId}", async (
            string userId,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = new DeleteUserCommand { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("DeleteUser")
        .Produces(204)
        .Produces(400);

        adminGroup.MapGet("/users/export", async (
            [FromQuery] string? status,
            [FromQuery] string? role,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new ExportUsersQuery
            {
                Status = status,
                Role = role
            };

            return await mediator.SendQuery(query);
        })
        .WithName("ExportUsers")
        .Produces(200)
        .Produces(400);

        // System Health
        adminGroup.MapGet("/system-health", async (
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new GetSystemHealthQuery();
            return await mediator.SendQuery(query);
        })
        .WithName("GetSystemHealth")
        .Produces<ApiResponse<SystemHealthResponse>>(200);

        // Audit Logs
        adminGroup.MapGet("/audit-logs", async (
            [FromQuery] int page,
            [FromQuery] int limit,
            [FromQuery] string? action,
            [FromQuery] string? user,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new GetAuditLogsQuery
            {
                PageNumber = page > 0 ? page : 1,
                PageSize = limit > 0 ? limit : 50,
                Action = action,
                User = user,
                StartDate = startDate,
                EndDate = endDate
            };
            return await mediator.SendQuery(query);
        })
        .WithName("GetAuditLogs")
        .Produces<PagedResponse<AuditLogResponse>>(200);

        // Settings
        adminGroup.MapGet("/settings", async (
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new GetAdminSettingsQuery();
            return await mediator.SendQuery(query);
        })
        .WithName("GetAdminSettings")
        .Produces<ApiResponse<AdminSettingsResponse>>(200);

        adminGroup.MapPut("/settings", async (
            [FromBody] UpdateAdminSettingsRequest request,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateAdminSettingsCommand
            {
                Settings = request
            };
            return await mediator.SendCommand(command);
        })
        .WithName("UpdateAdminSettings")
        .Produces<ApiResponse<AdminSettingsResponse>>(200)
        .Produces(400);

        // Bulk Actions
        adminGroup.MapPost("/users/bulk-action", async (
            [FromBody] BulkUserActionRequest request,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = new BulkUserActionCommand
            {
                UserIds = request.UserIds,
                Action = request.Action,
                Reason = request.Reason
            };
            return await mediator.SendCommand(command);
        })
        .WithName("BulkUserAction")
        .Produces<ApiResponse<object>>(200)
        .Produces(400);

        // System Operations
        adminGroup.MapPost("/system-health/clear-cache", async (
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = new ClearCacheCommand();
            return await mediator.SendCommand(command);
        })
        .WithName("ClearCache")
        .Produces<ApiResponse<object>>(200)
        .Produces(400);

        adminGroup.MapPost("/dashboard/send-notification", async (
            [FromBody] SendBulkNotificationRequest request,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = new SendBulkNotificationCommand
            {
                Title = request.Title,
                Message = request.Message,
                Type = request.Type,
                TargetUsers = request.TargetUsers,
                TargetRoles = request.TargetRoles
            };
            return await mediator.SendCommand(command);
        })
        .WithName("SendBulkNotification")
        .Produces<ApiResponse<object>>(200)
        .Produces(400);

        // Security Monitoring
        adminGroup.MapGet("/security/alerts", async (
            [FromQuery] int pageNumber,
            [FromQuery] int pageSize,
            [FromQuery] string? minLevel,
            [FromQuery] string? type,
            [FromQuery] bool includeRead,
            [FromQuery] bool includeDismissed,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new GetSecurityAlertsQuery
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                MinLevel = minLevel,
                Type = type,
                IncludeRead = includeRead,
                IncludeDismissed = includeDismissed
            };
            return await mediator.SendQuery(query);
        })
        .WithName("GetSecurityAlerts")
        .Produces<PagedResponse<SecurityAlertResponse>>(200);

        adminGroup.MapGet("/security/alerts/{alertId}", async (
            string alertId,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new GetSecurityAlertByIdQuery { AlertId = alertId };
            return await mediator.SendQuery(query);
        })
        .WithName("GetSecurityAlertById")
        .Produces<ApiResponse<SecurityAlertResponse>>(200)
        .Produces(404);

        adminGroup.MapGet("/security/statistics", async (
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new GetSecurityAlertStatisticsQuery
            {
                From = from,
                To = to
            };
            return await mediator.SendQuery(query);
        })
        .WithName("GetSecurityAlertStatistics")
        .Produces<ApiResponse<SecurityAlertStatisticsResponse>>(200);

        adminGroup.MapPost("/security/alerts/{alertId}/dismiss", async (
            string alertId,
            [FromBody] DismissSecurityAlertRequest request,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var adminUserId = httpContext.User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value ?? "unknown";
            var command = new DismissSecurityAlertCommand
            {
                AlertId = alertId,
                AdminUserId = adminUserId,
                Reason = request.Reason
            };
            return await mediator.SendCommand(command);
        })
        .WithName("DismissSecurityAlert")
        .Produces<ApiResponse<SecurityAlertActionResponse>>(200)
        .Produces(400);

        adminGroup.MapPost("/security/alerts/{alertId}/mark-read", async (
            string alertId,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var adminUserId = httpContext.User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value ?? "unknown";
            var command = new MarkAlertAsReadCommand
            {
                AlertId = alertId,
                AdminUserId = adminUserId
            };
            return await mediator.SendCommand(command);
        })
        .WithName("MarkAlertAsRead")
        .Produces<ApiResponse<SecurityAlertActionResponse>>(200)
        .Produces(400);

        // Reports Generation
        adminGroup.MapPost("/dashboard/generate-report", async (
            [FromBody] GenerateReportRequest request,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var command = new GenerateReportCommand
            {
                Type = request.Type,
                Parameters = request.Parameters
            };

            return await mediator.Send(command, cancellationToken);
        })
        .WithName("GenerateReport")
        .Produces(200)
        .Produces(400);
    }
}

