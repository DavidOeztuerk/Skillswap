using CQRS.Handlers;
using CQRS.Models;
using EventSourcing;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Permissions;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Permissions;

/// <summary>
/// Handler for revoking permissions from users
/// </summary>
public class RevokePermissionCommandHandler(
    IPermissionRepository permissionRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<RevokePermissionCommandHandler> logger)
    : BaseCommandHandler<RevokePermissionCommand, bool>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<bool>> Handle(
        RevokePermissionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
                return Error("UserId is required");

            if (string.IsNullOrEmpty(request.PermissionName))
                return Error("PermissionName is required");

            // Parse UserId to Guid
            if (!Guid.TryParse(request.UserId, out var userId))
                return Error("Invalid UserId format");

            // Parse RevokedBy to Guid if provided
            Guid? revokedBy = null;
            if (!string.IsNullOrEmpty(request.RevokedBy))
            {
                if (Guid.TryParse(request.RevokedBy, out var revokedByGuid))
                    revokedBy = revokedByGuid;
            }

            await _permissionRepository.RevokePermissionFromUserAsync(
                userId,
                request.PermissionName,
                revokedBy,
                request.Reason);

            Logger.LogInformation("Permission {Permission} revoked from user {UserId} by {RevokedBy}",
                request.PermissionName, request.UserId, request.RevokedBy);

            // TODO: Publish domain event for permission revoked
            // await _eventPublisher.Publish(new PermissionRevokedDomainEvent(...), cancellationToken);

            return Success(true, "Permission revoked successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error revoking permission {Permission} from user {UserId}",
                request.PermissionName, request.UserId);
            return Error("An error occurred while revoking permission");
        }
    }
}