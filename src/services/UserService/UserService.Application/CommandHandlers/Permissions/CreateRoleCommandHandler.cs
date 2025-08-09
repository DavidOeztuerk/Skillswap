using CQRS.Handlers;
using Contracts.UserService.Permissions;
using EventSourcing;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Permissions;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Permissions;

/// <summary>
/// Handler for creating new roles
/// </summary>
public class CreateRoleCommandHandler(
    IPermissionRepository permissionRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateRoleCommandHandler> logger)
    : BaseCommandHandler<CreateRoleCommand, RoleDto>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<CQRS.Models.ApiResponse<RoleDto>> Handle(
        CreateRoleCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Name))
                return Error("Role name is required");

            if (string.IsNullOrEmpty(request.Description))
                return Error("Role description is required");

            // Parse ParentRoleId to Guid if provided
            Guid? parentRoleId = null;
            if (!string.IsNullOrEmpty(request.ParentRoleId))
            {
                if (!Guid.TryParse(request.ParentRoleId, out var parentRoleGuid))
                    return Error("Invalid ParentRoleId format");
                parentRoleId = parentRoleGuid;
            }

            var role = await _permissionRepository.CreateRoleAsync(
                request.Name,
                request.Description,
                request.Priority,
                parentRoleId);

            // Add initial permissions if provided
            if (request.InitialPermissions != null && request.InitialPermissions.Any())
            {
                foreach (var permissionName in request.InitialPermissions)
                {
                    await _permissionRepository.GrantPermissionToRoleAsync(
                        Guid.Parse(role.Id),
                        permissionName,
                        null,
                        "Initial role permission");
                }
            }

            var roleDto = new RoleDto
            {
                Id = Guid.Parse(role.Id),
                Name = role.Name,
                Description = role.Description,
                Priority = role.Priority,
                IsSystemRole = role.IsSystemRole,
                IsActive = role.IsActive,
                Permissions = request.InitialPermissions ?? new List<string>()
            };

            Logger.LogInformation("Role {RoleName} created successfully", request.Name);

            // TODO: Publish domain event for role created
            // await _eventPublisher.Publish(new RoleCreatedDomainEvent(...), cancellationToken);

            return Success(roleDto, "Role created successfully");
        }
        catch (ArgumentException ex)
        {
            Logger.LogWarning(ex, "Invalid argument when creating role");
            return Error(ex.Message);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating role {RoleName}", request.Name);
            return Error("An error occurred while creating role");
        }
    }
}