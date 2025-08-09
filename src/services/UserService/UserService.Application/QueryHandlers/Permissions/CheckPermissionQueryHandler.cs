using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.Permissions;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers.Permissions;

/// <summary>
/// Handler for checking if user has a specific permission
/// </summary>
public class CheckPermissionQueryHandler(
    IPermissionRepository permissionRepository,
    ILogger<CheckPermissionQueryHandler> logger)
    : BaseQueryHandler<CheckPermissionQuery, bool>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;

    public override async Task<ApiResponse<bool>> Handle(
        CheckPermissionQuery request,
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

            var hasPermission = await _permissionRepository.UserHasPermissionAsync(
                userId.ToString(), request.PermissionName, request.ResourceId);

            return Success(hasPermission);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error checking permission {Permission} for user {UserId}",
                request.PermissionName, request.UserId);
            return Error("An error occurred while checking permission");
        }
    }
}