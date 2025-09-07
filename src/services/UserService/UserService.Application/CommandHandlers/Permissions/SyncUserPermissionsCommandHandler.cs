using CQRS.Handlers;
using CQRS.Models;
using EventSourcing;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Permissions;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers.Permissions;

/// <summary>
/// Handler for syncing user permissions
/// </summary>
public class SyncUserPermissionsCommandHandler(
    IPermissionRepository permissionRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<SyncUserPermissionsCommandHandler> logger)
    : BaseCommandHandler<SyncUserPermissionsCommand, bool>(logger)
{
    private readonly IPermissionRepository _permissionRepository = permissionRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<bool>> Handle(
        SyncUserPermissionsCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
                return Error("UserId is required", ErrorCodes.RequiredFieldMissing);

            if (request.PermissionNames == null || !request.PermissionNames.Any())
                return Error("PermissionNames cannot be empty", ErrorCodes.RequiredFieldMissing);

            // Parse UserId to Guid
            if (!Guid.TryParse(request.UserId, out var userId))
                return Error("Invalid UserId format", ErrorCodes.InvalidFormat);

            await _permissionRepository.SyncUserPermissionsAsync(userId, request.PermissionNames);

            Logger.LogInformation("Permissions synced for user {UserId}. New permissions: {Permissions}",
                request.UserId, string.Join(", ", request.PermissionNames));

            // TODO: Publish domain event for permissions synced
            // await _eventPublisher.Publish(new UserPermissionsSyncedDomainEvent(...), cancellationToken);

            return Success(true, "Permissions synced successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error syncing permissions for user {UserId}", request.UserId);
            return Error("An error occurred while syncing permissions", ErrorCodes.InternalError);
        }
    }
}