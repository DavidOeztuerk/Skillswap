using Contracts.UserService.Permissions;
using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.Permissions;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers.Permissions;

/// <summary>
/// Handler for getting permission history for a user
/// </summary>
public class GetPermissionHistoryQueryHandler(
    IPermissionRepository permissionRepository,
    ILogger<GetPermissionHistoryQueryHandler> logger)
    : BaseQueryHandler<GetPermissionHistoryQuery, PermissionHistoryResponse>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;

    public override async Task<CQRS.Models.ApiResponse<PermissionHistoryResponse>> Handle(
        GetPermissionHistoryQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
                return Error("UserId is required");

            // Parse UserId to Guid
            if (!Guid.TryParse(request.UserId, out var userId))
                return Error("Invalid UserId format");

            var history = await _permissionRepository.GetUserPermissionHistoryAsync(userId.ToString());
            
            var entries = history.Select(h => new PermissionHistoryEntry
            {
                Id = Guid.Parse(h.Id),
                PermissionName = h.Permission?.Name ?? "Unknown",
                Action = h.IsActive ? "Granted" : "Revoked",
                Timestamp = h.IsActive ? h.GrantedAt : h.RevokedAt ?? h.GrantedAt,
                PerformedBy = h.IsActive ? h.GrantedBy?.ToString() : h.RevokedBy?.ToString(),
                Reason = h.Reason,
                ExpiresAt = h.ExpiresAt,
                ResourceId = h.ResourceId
            }).ToList();

            var response = new PermissionHistoryResponse { Entries = entries };
            
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting permission history for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving permission history");
        }
    }
}