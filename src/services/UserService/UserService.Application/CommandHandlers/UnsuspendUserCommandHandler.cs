using CQRS.Handlers;
using CQRS.Models;
using Events.Notification;
using MassTransit;
using Microsoft.Extensions.Logging;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;
using UserService.Application.Commands;

namespace UserService.Application.CommandHandlers;

public class UnsuspendUserCommandHandler(
    IUserRepository context,
    IPublishEndpoint publishEndpoint,
    ILogger<UnsuspendUserCommandHandler> logger)
    : BaseCommandHandler<UnsuspendUserCommand, AdminUserResponse>(logger)
{
    private readonly IUserRepository _context = context;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<AdminUserResponse>> Handle(
        UnsuspendUserCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Unsuspending user {UserId}", request.UserId);

            if (request.UserId is null)
                return Error("UserId is required", ErrorCodes.RequiredFieldMissing);

            var user = await _context.GetUserById(request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found", ErrorCodes.ResourceNotFound);
            }

            if (!user.IsSuspended)
            {
                return Error("User is not suspended", ErrorCodes.InvalidOperation);
            }

            // Unsuspend user
            user.IsSuspended = false;
            user.SuspendedAt = null;
            user.SuspensionReason = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.UpdateUser(user, cancellationToken);

            // Publish event for notification
            await _publishEndpoint.Publish(new AccountUnsuspendedNotificationEvent(
                user.Id,
                user.Email,
                user.UserName,
                DateTime.UtcNow
            ), cancellationToken);

            var response = new AdminUserResponse
            {
                Id = user.Id.ToString(),
                Username = user.UserName,
                Email = user.Email,
                Roles = [.. user.UserRoles.Where(x => x.RevokedAt == null).Select(x => x.Role.Name)],
                AccountStatus = "active",
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                EmailVerified = user.EmailVerified,
                TwoFactorEnabled = user.TwoFactorEnabled
            };

            return Success(response, "User unsuspended successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error unsuspending user {UserId}", request.UserId);
            return Error("Failed to unsuspend user", ErrorCodes.InternalError);
        }
    }
}
