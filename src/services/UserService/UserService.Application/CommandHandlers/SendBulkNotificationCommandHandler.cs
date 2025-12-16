using CQRS.Handlers;
using CQRS.Models;
using Events.Notification;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;
using UserService.Application.Commands;

namespace UserService.Application.CommandHandlers;

public class SendBulkNotificationCommandHandler(
    IUserRepository userRepository,
    IPublishEndpoint publishEndpoint,
    ILogger<SendBulkNotificationCommandHandler> logger)
    : BaseCommandHandler<SendBulkNotificationCommand, object>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<object>> Handle(
        SendBulkNotificationCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Sending bulk notification - Title: {Title}, Type: {Type}",
                request.Title, request.Type);

            if (string.IsNullOrWhiteSpace(request.Title))
                return Error("Title is required", ErrorCodes.RequiredFieldMissing);

            if (string.IsNullOrWhiteSpace(request.Message))
                return Error("Message is required", ErrorCodes.RequiredFieldMissing);

            var results = new BulkNotificationResult();
            var targetUserIds = new List<string>();

            // Determine target users
            if (request.TargetUsers != null && request.TargetUsers.Count > 0)
            {
                // Send to specific users
                targetUserIds.AddRange(request.TargetUsers);
            }
            else if (request.TargetRoles != null && request.TargetRoles.Count > 0)
            {
                // Send to users with specific roles
                var usersQuery = _userRepository.GetUsers(cancellationToken);

                foreach (var role in request.TargetRoles)
                {
                    var usersWithRole = await usersQuery
                        .Where(u => !u.IsDeleted && !u.IsSuspended)
                        .Where(u => u.UserRoles.Any(ur =>
                            ur.RevokedAt == null &&
                            ur.Role.Name.ToLower() == role.ToLower()))
                        .Select(u => u.Id)
                        .ToListAsync(cancellationToken);

                    targetUserIds.AddRange(usersWithRole);
                }

                // Remove duplicates
                targetUserIds = targetUserIds.Distinct().ToList();
            }
            else
            {
                // Send to all active users
                var allUsers = await _userRepository.GetUsers(cancellationToken)
                    .Where(u => !u.IsDeleted && !u.IsSuspended)
                    .Select(u => u.Id)
                    .ToListAsync(cancellationToken);

                targetUserIds.AddRange(allUsers);
            }

            results.TotalTargeted = targetUserIds.Count;

            if (targetUserIds.Count == 0)
            {
                return Success(results, "No users matched the target criteria");
            }

            // Send notifications
            foreach (var userId in targetUserIds)
            {
                try
                {
                    await _publishEndpoint.Publish(new BulkNotificationEvent(
                        userId,
                        request.Title!,
                        request.Message!,
                        request.Type ?? "info",
                        DateTime.UtcNow
                    ), cancellationToken);

                    results.Sent++;
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, "Failed to send notification to user {UserId}", userId);
                    results.Failed++;
                    results.Errors.Add($"User {userId}: {ex.Message}");
                }
            }

            var message = $"Bulk notification sent: {results.Sent} successful, {results.Failed} failed out of {results.TotalTargeted} targeted";
            Logger.LogInformation(message);

            return Success(results, message);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error sending bulk notification");
            return Error("Failed to send bulk notification", ErrorCodes.InternalError);
        }
    }
}

public class BulkNotificationResult
{
    public int TotalTargeted { get; set; }
    public int Sent { get; set; }
    public int Failed { get; set; }
    public List<string> Errors { get; set; } = [];
}
