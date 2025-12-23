using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.Queries.Handlers;

public class GetAuditLogsQueryHandler(
    IUserActivityRepository activityRepository,
    IUserRepository userRepository,
    ILogger<GetAuditLogsQueryHandler> logger)
    : BasePagedQueryHandler<GetAuditLogsQuery, AuditLogResponse>(logger)
{
    private readonly IUserActivityRepository _activityRepository = activityRepository;
    private readonly IUserRepository _userRepository = userRepository;

    public override async Task<PagedResponse<AuditLogResponse>> Handle(
        GetAuditLogsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Getting audit logs with filters - Action: {Action}, User: {User}, StartDate: {StartDate}, EndDate: {EndDate}",
                request.Action, request.User, request.StartDate, request.EndDate);

            // If a specific user is requested, get their activities
            string? userId = null;
            if (!string.IsNullOrWhiteSpace(request.User))
            {
                // Try to find user by email or username
                var users = _userRepository.GetUsers(cancellationToken);
                var user = await users
                    .Where(u => u.Email.ToLower().Contains(request.User.ToLower()) ||
                               u.UserName.ToLower().Contains(request.User.ToLower()))
                    .FirstOrDefaultAsync(cancellationToken);

                if (user != null)
                {
                    userId = user.Id;
                }
                else
                {
                    // No user found, return empty results
                    return Success([], request.PageNumber, request.PageSize, 0, "No audit logs found for specified user");
                }
            }

            // Get activities - for now, we'll aggregate from user activities
            // In a full implementation, you would have a dedicated AuditLog table
            var (activities, totalCount) = await _activityRepository.GetUserActivities(
                userId ?? string.Empty, // Empty string means all users if supported
                request.StartDate,
                request.EndDate,
                request.Action,
                request.PageNumber,
                request.PageSize,
                cancellationToken);

            // Map to audit log responses
            var auditLogs = new List<AuditLogResponse>();
            foreach (var activity in activities)
            {
                var user = await _userRepository.GetUserById(activity.UserId, cancellationToken);
                auditLogs.Add(new AuditLogResponse
                {
                    Id = activity.Id.ToString(),
                    Action = activity.ActivityType,
                    UserId = activity.UserId,
                    UserEmail = user?.Email,
                    Details = activity.Description,
                    IpAddress = activity.IpAddress,
                    Timestamp = activity.CreatedAt
                });
            }

            return Success(auditLogs, request.PageNumber, request.PageSize, totalCount, "Audit logs retrieved successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting audit logs");
            return Error("Failed to retrieve audit logs", ErrorCodes.InternalError);
        }
    }
}
