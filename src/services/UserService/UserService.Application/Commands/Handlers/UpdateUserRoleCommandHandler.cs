using CQRS.Handlers;
using CQRS.Models;
using MassTransit;
using Microsoft.Extensions.Logging;
using UserService.Domain.Events;
using UserService.Domain.Repositories;

namespace UserService.Application.Commands.Handlers;

public class UpdateUserRoleCommandHandler(
    IUserRepository users,
    IPublishEndpoint bus,
    ILogger<UpdateUserRoleCommandHandler> logger)
    : BaseCommandHandler<UpdateUserRoleCommand, AdminUserResponse>(logger)
{
    private readonly IUserRepository _users = users;
    private readonly IPublishEndpoint _bus = bus;

    public override async Task<ApiResponse<AdminUserResponse>> Handle(UpdateUserRoleCommand request, CancellationToken ct)
    {
        try
        {
            Logger.LogInformation("Updating user role for user {UserId} to {Role}", request.UserId, request.Role);

            if (string.IsNullOrWhiteSpace(request.UserId)) return Error("User Id is required");
            if (string.IsNullOrWhiteSpace(request.Role)) return Error("Role is required");

            // Load user incl. roles->role entity (repo implementation should ThenInclude Role)
            var user = await _users.GetUserWithRoles(request.UserId, ct);
            if (user is null) return Error("User not found");

            // No-op if already active
            var alreadyHasRole = user.UserRoles.Any(ur => ur.RevokedAt == null && ur.Role.Name == request.Role);
            if (!alreadyHasRole)
            {
                try
                {
                    await _users.AssignUserRole(user.Id, request.Role, assignedBy: "system", ct);
                }
                catch (InvalidOperationException ex) when (ex.Message.StartsWith("Role not found", StringComparison.OrdinalIgnoreCase))
                {
                    return Error($"Invalid role: {request.Role}");
                }
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _users.UpdateUser(user, ct);

            // Publish event
            await _bus.Publish(new UserRoleUpdatedEvent
            {
                UserId = user.Id,
                NewRole = request.Role.Trim(),
                UpdatedAt = DateTime.UtcNow
            }, ct);

            // Reload (or use in-memory + added role name)
            var roles = user.UserRoles
                .Where(r => r.RevokedAt == null)
                .Select(r => r.Role.Name)
                .Distinct()
                .ToList();

            var resp = new AdminUserResponse
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                Roles = roles,
                AccountStatus = user.IsSuspended ? "suspended" : "active",
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                EmailVerified = user.EmailVerified,
                TwoFactorEnabled = user.TwoFactorEnabled
            };

            return Success(resp, alreadyHasRole ? "User already had role" : "User role updated");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error updating user role for user {UserId}", request.UserId);
            return Error("Failed to update user role");
        }
    }
}
