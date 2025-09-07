using Contracts.UserService.Permissions;
using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.Permissions;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.QueryHandlers.Permissions;

/// <summary>
/// Handler for getting user permissions
/// </summary>
public class GetUserPermissionsQueryHandler(
    IPermissionRepository permissionRepository,
    ILogger<GetUserPermissionsQueryHandler> logger)
    : BaseQueryHandler<GetUserPermissionsQuery, UserPermissionsResponse>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;

    public override async Task<CQRS.Models.ApiResponse<UserPermissionsResponse>> Handle(
        GetUserPermissionsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
                return Error("UserId is required", ErrorCodes.RequiredFieldMissing);

            // Parse UserId to Guid
            if (!Guid.TryParse(request.UserId, out var userId))
                return Error("Invalid UserId format", ErrorCodes.InvalidFormat);

            var permissions = await _permissionRepository.GetUserPermissionsAsync(userId.ToString());
            var roles = await _permissionRepository.GetUserRoleNamesAsync(userId.ToString());
            var permissionNames = await _permissionRepository.GetUserPermissionNamesAsync(userId.ToString());

            var permissionDtos = permissions
                .Where(p => p.Permission != null)
                .Select(p => new PermissionDto
                {
                    Id = Guid.Parse(p.Permission.Id),
                    Name = p.Permission.Name,
                    Category = p.Permission.Category,
                    Description = p.Permission.Description,
                    Resource = p.Permission.Resource,
                    IsSystemPermission = p.Permission.IsSystemPermission,
                    IsActive = p.IsActive,
                    Source = "Direct" // Will be updated based on source
                }).ToList();

            var permissionsByCategory = permissionDtos
                .GroupBy(p => p.Category)
                .ToDictionary(g => g.Key, g => g.Select(p => p.Name).ToList());

            var response = new UserPermissionsResponse
            {
                UserId = userId,
                Roles = roles.ToList(),
                Permissions = permissionDtos,
                PermissionNames = permissionNames.ToList(),
                PermissionsByCategory = permissionsByCategory,
                CachedAt = DateTime.UtcNow
            };

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting permissions for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving permissions", ErrorCodes.InternalError);
        }
    }
}