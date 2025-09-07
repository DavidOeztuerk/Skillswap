using Contracts.UserService.Permissions;
using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.Permissions;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.QueryHandlers.Permissions;

/// <summary>
/// Handler for getting all available permissions
/// </summary>
public class GetAllPermissionsQueryHandler(
    IPermissionRepository permissionRepository,
    ILogger<GetAllPermissionsQueryHandler> logger)
    : BaseQueryHandler<GetAllPermissionsQuery, List<PermissionDto>>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;

    public override async Task<CQRS.Models.ApiResponse<List<PermissionDto>>> Handle(
        GetAllPermissionsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var permissions = await _permissionRepository.GetAllPermissionsAsync();
            
            var permissionDtos = permissions.Select(p => new PermissionDto
            {
                Id = Guid.Parse(p.Id),
                Name = p.Name,
                Category = p.Category,
                Description = p.Description,
                Resource = p.Resource,
                IsSystemPermission = p.IsSystemPermission,
                IsActive = p.IsActive
            }).ToList();

            return Success(permissionDtos);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting all permissions");
            return Error("An error occurred while retrieving permissions", ErrorCodes.InternalError);
        }
    }
}