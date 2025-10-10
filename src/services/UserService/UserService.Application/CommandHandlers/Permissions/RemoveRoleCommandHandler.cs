using CQRS.Handlers;
using CQRS.Models;
using EventSourcing;
using Events.Domain.User;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Permissions;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers.Permissions;

/// <summary>
/// Handler for removing roles from users
/// </summary>
public class RemoveRoleCommandHandler(
    IPermissionRepository permissionRepository,
    IUserProfileRepository userProfileRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<RemoveRoleCommandHandler> logger)
    : BaseCommandHandler<RemoveRoleCommand, bool>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;
    private readonly IUserProfileRepository _userProfileRepository = userProfileRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<bool>> Handle(
        RemoveRoleCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
                return Error("UserId is required", ErrorCodes.RequiredFieldMissing);

            if (string.IsNullOrEmpty(request.RoleName))
                return Error("RoleName is required", ErrorCodes.RequiredFieldMissing);

            // Parse UserId to Guid
            if (!Guid.TryParse(request.UserId, out var userId))
                return Error("Invalid UserId format", ErrorCodes.InvalidFormat);

            // Parse RemovedBy to Guid if provided
            Guid? removedBy = null;
            if (!string.IsNullOrEmpty(request.RemovedBy))
            {
                if (Guid.TryParse(request.RemovedBy, out var removedByGuid))
                    removedBy = removedByGuid;
            }

            await _permissionRepository.RemoveRoleFromUserAsync(
                userId,
                request.RoleName,
                removedBy,
                request.Reason);

            Logger.LogInformation("Role {Role} removed from user {UserId} by {RemovedBy}",
                request.RoleName, request.UserId, request.RemovedBy);

            var user = await _userProfileRepository.GetUserProfile(request.UserId, cancellationToken);
            if (user != null)
            {
                await _eventPublisher.Publish(
                    new UserRoleRevokedDomainEvent(
                        request.UserId,
                        user.Email,
                        request.RoleName,
                        request.RemovedBy ?? "System"),
                    cancellationToken);
            }

            return Success(true, "Role removed successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error removing role {Role} from user {UserId}",
                request.RoleName, request.UserId);
            return Error("An error occurred while removing role", ErrorCodes.InternalError);
        }
    }
}