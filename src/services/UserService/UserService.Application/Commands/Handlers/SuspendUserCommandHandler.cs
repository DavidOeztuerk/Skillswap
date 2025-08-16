using CQRS.Handlers;
using CQRS.Models;
using Events.Notification;
using MassTransit;
using Microsoft.Extensions.Logging;
using UserService.Domain.Repositories;

namespace UserService.Application.Commands.Handlers;

public class SuspendUserCommandHandler(
    IUserRepository context,
    IPublishEndpoint publishEndpoint,
    ILogger<SuspendUserCommandHandler> logger)
    : BaseCommandHandler<SuspendUserCommand, AdminUserResponse>(logger)
{
    private readonly IUserRepository _context = context;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<AdminUserResponse>> Handle(
        SuspendUserCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Suspending user {UserId} for reason: {Reason}", request.UserId, request.Reason);

            if (request.UserId is null)
                return Error("UserId is required");

            var user = await _context.GetUserById(request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found");
            }

            if (user.IsSuspended)
            {
                return Error("User is already suspended");
            }

            // Suspend user
            user.IsSuspended = true;
            user.SuspendedAt = DateTime.UtcNow;
            user.SuspensionReason = request.Reason;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.UpdateUser(user, cancellationToken);

            // Publish event
            await _publishEndpoint.Publish(new AccountSuspendedNotificationEvent(
                user.Id,
                user.Email,
                user.UserName,
                request.Reason ?? string.Empty,
                user.SuspendedAt.Value
            ), cancellationToken);

            var response = new AdminUserResponse
            {
                Id = user.Id.ToString(),
                Username = user.UserName,
                Email = user.Email,
                Roles = [.. user.UserRoles.Select(x => x.Role.Name)],
                AccountStatus = "suspended",
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                EmailVerified = user.EmailVerified,
                TwoFactorEnabled = user.TwoFactorEnabled
            };

            return Success(response, "User suspended successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error suspending user {UserId}", request.UserId);
            return Error("Failed to suspend user");
        }
    }
}