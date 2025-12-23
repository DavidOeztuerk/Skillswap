using CQRS.Handlers;
using CQRS.Models;
using Events.Integration.UserManagement;
using MassTransit;
using Microsoft.Extensions.Logging;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;
using UserService.Application.Commands;

namespace UserService.Application.CommandHandlers;

public class DeleteUserCommandHandler(
    IUserRepository context,
    IPublishEndpoint publishEndpoint,
    ILogger<DeleteUserCommandHandler> logger)
    : BaseCommandHandler<DeleteUserCommand, object>(logger)
{
    private readonly IUserRepository _context = context;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<object>> Handle(
        DeleteUserCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Deleting user {UserId}", request.UserId);

            if (request.UserId is null)
                return Error("UserId is required", ErrorCodes.RequiredFieldMissing);

            var user = await _context.GetUserById(request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found", ErrorCodes.ResourceNotFound);
            }

            // Check if user is admin - prevent admin self-deletion
            var isAdmin = user.UserRoles.Any(ur =>
                ur.RevokedAt == null &&
                ur.Role.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase));

            if (isAdmin)
            {
                Logger.LogWarning("Attempted to delete admin user {UserId}", request.UserId);
                return Error("Cannot delete admin users through this endpoint", ErrorCodes.InsufficientPermissions);
            }

            // Store user info for event before deletion
            var userEmail = user.Email;
            var userName = user.UserName;
            var userId = user.Id;

            // Soft delete - mark user as deleted instead of removing
            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            // Anonymize PII for GDPR compliance
            user.Email = $"deleted-{user.Id}@deleted.local";
            user.UserName = $"deleted-{user.Id}";
            user.FirstName = "Deleted";
            user.LastName = "User";
            user.Bio = null;
            user.ProfilePictureUrl = null;

            await _context.UpdateUser(user, cancellationToken);

            // Publish user deleted event for other services to clean up
            await _publishEndpoint.Publish(new UserDeletedEvent(
                userId,
                userEmail,
                "Admin",
                "User deleted by admin"
            ), cancellationToken);

            Logger.LogInformation("User {UserId} deleted successfully", request.UserId);

            return Success(new { Message = "User deleted successfully" }, "User deleted successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error deleting user {UserId}", request.UserId);
            return Error("Failed to delete user", ErrorCodes.InternalError);
        }
    }
}
