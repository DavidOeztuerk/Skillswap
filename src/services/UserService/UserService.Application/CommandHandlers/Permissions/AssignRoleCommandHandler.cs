using CQRS.Handlers;
using CQRS.Models;
using EventSourcing;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Permissions;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Permissions;

/// <summary>
/// Handler for assigning roles to users
/// </summary>
public class AssignRoleCommandHandler(
    IPermissionRepository permissionRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<AssignRoleCommandHandler> logger)
    : BaseCommandHandler<AssignRoleCommand, ApiResponse<bool>>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<ApiResponse<bool>>> Handle(
        AssignRoleCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
                return Error("UserId is required");

            if (string.IsNullOrEmpty(request.RoleName))
                return Error("RoleName is required");

            // Parse UserId to Guid
            if (!Guid.TryParse(request.UserId, out var userId))
                return Error("Invalid UserId format");

            // Parse AssignedBy to Guid if provided
            Guid? assignedBy = null;
            if (!string.IsNullOrEmpty(request.AssignedBy))
            {
                if (Guid.TryParse(request.AssignedBy, out var assignedByGuid))
                    assignedBy = assignedByGuid;
            }

            await _permissionRepository.AssignRoleToUserAsync(
                userId,
                request.RoleName,
                assignedBy,
                request.Reason);

            Logger.LogInformation("Role {Role} assigned to user {UserId} by {AssignedBy}",
                request.RoleName, request.UserId, request.AssignedBy);

            // TODO: Publish domain event for role assigned
            // await _eventPublisher.Publish(new RoleAssignedDomainEvent(...), cancellationToken);

            return Success(ApiResponse<bool>.SuccessResult(true, "Role assigned successfully"));
        }
        catch (ArgumentException ex)
        {
            Logger.LogWarning(ex, "Invalid argument when assigning role");
            return Error(ex.Message);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error assigning role {Role} to user {UserId}",
                request.RoleName, request.UserId);
            return Error("An error occurred while assigning role");
        }
    }
}