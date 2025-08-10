using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.Permissions;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers.Permissions;

/// <summary>
/// Handler for checking if user has multiple permissions
/// </summary>
public class CheckMultiplePermissionsQueryHandler(
    IPermissionRepository permissionRepository,
    ILogger<CheckMultiplePermissionsQueryHandler> logger)
    : BaseQueryHandler<CheckMultiplePermissionsQuery, bool>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;

    public override async Task<ApiResponse<bool>> Handle(
        CheckMultiplePermissionsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
                return Error("UserId is required");

            if (request.PermissionNames == null || !request.PermissionNames.Any())
                return Error("PermissionNames cannot be empty");

            // Parse UserId to Guid
            if (string.IsNullOrEmpty(request.UserId))
                return Error("Invalid UserId format");

            bool result;
            if (request.RequireAll)
            {
                result = await _permissionRepository.UserHasAllPermissionsAsync(
                    request.UserId, request.PermissionNames, cancellationToken);
            }
            else
            {
                result = await _permissionRepository.UserHasAnyPermissionAsync(
                    request.UserId, request.PermissionNames, cancellationToken);
            }

            return Success(result);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error checking multiple permissions for user {UserId}", request.UserId);
            return Error("An error occurred while checking permissions");
        }
    }
}