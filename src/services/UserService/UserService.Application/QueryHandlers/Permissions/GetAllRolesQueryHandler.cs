using Contracts.UserService.Permissions;
using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.Permissions;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers.Permissions;

/// <summary>
/// Handler for getting all available roles
/// </summary>
public class GetAllRolesQueryHandler(
    IPermissionRepository permissionRepository,
    ILogger<GetAllRolesQueryHandler> logger)
    : BaseQueryHandler<GetAllRolesQuery, List<RoleDto>>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;

    public override async Task<CQRS.Models.ApiResponse<List<RoleDto>>> Handle(
        GetAllRolesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var roles = await _permissionRepository.GetAllRolesAsync();
            var roleDtos = new List<RoleDto>();

            foreach (var role in roles)
            {
                var permissions = await _permissionRepository.GetRolePermissionsAsync(
                    role.Id, cancellationToken);
                
                roleDtos.Add(new RoleDto
                {
                    Id = Guid.Parse(role.Id),
                    Name = role.Name,
                    Description = role.Description,
                    Priority = role.Priority,
                    IsSystemRole = role.IsSystemRole,
                    IsActive = role.IsActive,
                    Permissions = permissions.Where(p => p.Permission != null).Select(p => p.Permission.Name).ToList()
                });
            }

            return Success(roleDtos);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting all roles");
            return Error("An error occurred while retrieving roles");
        }
    }
}