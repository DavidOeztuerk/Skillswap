using CQRS.Handlers;
using CQRS.Models;
using Events.Notification;
using MassTransit;
using Microsoft.Extensions.Logging;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;
using UserService.Application.Commands;

namespace UserService.Application.CommandHandlers;

public class BulkUserActionCommandHandler(
    IUserRepository context,
    IPublishEndpoint publishEndpoint,
    ILogger<BulkUserActionCommandHandler> logger)
    : BaseCommandHandler<BulkUserActionCommand, object>(logger)
{
    private readonly IUserRepository _context = context;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<object>> Handle(
        BulkUserActionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Executing bulk action {Action} on {Count} users",
                request.Action, request.UserIds?.Count ?? 0);

            if (request.UserIds == null || request.UserIds.Count == 0)
                return Error("At least one user ID is required", ErrorCodes.RequiredFieldMissing);

            if (string.IsNullOrWhiteSpace(request.Action))
                return Error("Action is required", ErrorCodes.RequiredFieldMissing);

            var results = new BulkActionResult
            {
                TotalRequested = request.UserIds.Count,
                Successful = 0,
                Failed = 0,
                Errors = []
            };

            foreach (var userId in request.UserIds)
            {
                try
                {
                    var user = await _context.GetUserById(userId, cancellationToken);

                    if (user == null)
                    {
                        results.Failed++;
                        results.Errors.Add($"User {userId}: Not found");
                        continue;
                    }

                    // Check if user is admin - skip admin actions
                    var isAdmin = user.UserRoles.Any(ur =>
                        ur.RevokedAt == null &&
                        ur.Role.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase));

                    if (isAdmin)
                    {
                        results.Failed++;
                        results.Errors.Add($"User {userId}: Cannot perform bulk actions on admin users");
                        continue;
                    }

                    switch (request.Action.ToLowerInvariant())
                    {
                        case "suspend":
                            if (user.IsSuspended)
                            {
                                results.Failed++;
                                results.Errors.Add($"User {userId}: Already suspended");
                                continue;
                            }
                            user.IsSuspended = true;
                            user.SuspendedAt = DateTime.UtcNow;
                            user.SuspensionReason = request.Reason;

                            await _publishEndpoint.Publish(new AccountSuspendedNotificationEvent(
                                user.Id,
                                user.Email,
                                user.UserName,
                                request.Reason ?? string.Empty,
                                user.SuspendedAt.Value
                            ), cancellationToken);
                            break;

                        case "unsuspend":
                            if (!user.IsSuspended)
                            {
                                results.Failed++;
                                results.Errors.Add($"User {userId}: Not suspended");
                                continue;
                            }
                            user.IsSuspended = false;
                            user.SuspendedAt = null;
                            user.SuspensionReason = null;

                            await _publishEndpoint.Publish(new AccountUnsuspendedNotificationEvent(
                                user.Id,
                                user.Email,
                                user.UserName,
                                DateTime.UtcNow
                            ), cancellationToken);
                            break;

                        case "verify_email":
                            if (user.EmailVerified)
                            {
                                results.Failed++;
                                results.Errors.Add($"User {userId}: Email already verified");
                                continue;
                            }
                            user.MarkEmailAsVerified();
                            break;

                        case "reset_2fa":
                            user.TwoFactorEnabled = false;
                            user.TwoFactorSecret = null;
                            break;

                        default:
                            results.Failed++;
                            results.Errors.Add($"User {userId}: Unknown action '{request.Action}'");
                            continue;
                    }

                    user.UpdatedAt = DateTime.UtcNow;
                    await _context.UpdateUser(user, cancellationToken);
                    results.Successful++;
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, "Error processing bulk action for user {UserId}", userId);
                    results.Failed++;
                    results.Errors.Add($"User {userId}: {ex.Message}");
                }
            }

            var message = $"Bulk action completed: {results.Successful} successful, {results.Failed} failed";
            Logger.LogInformation(message);

            return Success(results, message);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error executing bulk action");
            return Error("Failed to execute bulk action", ErrorCodes.InternalError);
        }
    }
}

public class BulkActionResult
{
    public int TotalRequested { get; set; }
    public int Successful { get; set; }
    public int Failed { get; set; }
    public List<string> Errors { get; set; } = [];
}
