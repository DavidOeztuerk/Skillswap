using CQRS.Handlers;
using CQRS.Models;
using EventSourcing;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Permissions;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Permissions;

/// <summary>
/// Handler for granting permissions to users
/// </summary>
public class GrantPermissionCommandHandler(
    IPermissionRepository permissionRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<GrantPermissionCommandHandler> logger)
    : BaseCommandHandler<GrantPermissionCommand, bool>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<bool>> Handle(
        GrantPermissionCommand request,
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

            // Parse GrantedBy to Guid if provided
            Guid? grantedBy = null;
            if (!string.IsNullOrEmpty(request.GrantedBy))
            {
                if (Guid.TryParse(request.GrantedBy, out var grantedByGuid))
                    grantedBy = grantedByGuid;
            }

            await _permissionRepository.GrantPermissionToUserAsync(
                userId,
                request.PermissionName,
                grantedBy,
                request.ExpiresAt,
                request.ResourceId,
                request.Reason);

            Logger.LogInformation("Permission {Permission} granted to user {UserId} by {GrantedBy}",
                request.PermissionName, request.UserId, request.GrantedBy);

            // TODO: Publish domain event for permission granted
            // await _eventPublisher.Publish(new PermissionGrantedDomainEvent(...), cancellationToken);

            return Success(true, "Permission granted successfully");
        }
        catch (ArgumentException ex)
        {
            Logger.LogWarning(ex, "Invalid argument when granting permission");
            return Error(ex.Message);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error granting permission {Permission} to user {UserId}",
                request.PermissionName, request.UserId);
            return Error("An error occurred while granting permission");
        }
    }
}