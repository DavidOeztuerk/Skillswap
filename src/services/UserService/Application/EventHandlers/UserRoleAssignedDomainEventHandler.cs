using CQRS.Handlers;
using UserService.Domain.Events;
using UserService.Domain.Models;

namespace UserService.Application.EventHandlers;

// ============================================================================
// ROLE MANAGEMENT EVENT HANDLERS
// ============================================================================

public class UserRoleAssignedDomainEventHandler(
    UserDbContext dbContext,
    ILogger<UserRoleAssignedDomainEventHandler> logger) 
    : BaseDomainEventHandler<UserRoleAssignedDomainEvent>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(
        UserRoleAssignedDomainEvent domainEvent, 
        CancellationToken cancellationToken)
    {
        // Log role assignment activity
        var activity = new UserActivity
        {
            UserId = domainEvent.UserId,
            ActivityType = ActivityTypes.RoleChange,
            Description = $"Role '{domainEvent.Role}' assigned by {domainEvent.AssignedBy}",
            Timestamp = DateTime.UtcNow,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                Action = "RoleAssigned",
                Role = domainEvent.Role,
                AssignedBy = domainEvent.AssignedBy
            })
        };

        _dbContext.UserActivities.Add(activity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Role {Role} assigned to user {UserId} by {AssignedBy}",
            domainEvent.Role, domainEvent.UserId, domainEvent.AssignedBy);
    }
}

public class UserRoleRevokedDomainEventHandler(
    UserDbContext dbContext,
    ILogger<UserRoleRevokedDomainEventHandler> logger) 
    : BaseDomainEventHandler<UserRoleRevokedDomainEvent>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(
        UserRoleRevokedDomainEvent domainEvent, 
        CancellationToken cancellationToken)
    {
        // Log role revocation activity
        var activity = new UserActivity
        {
            UserId = domainEvent.UserId,
            ActivityType = ActivityTypes.RoleChange,
            Description = $"Role '{domainEvent.Role}' revoked by {domainEvent.RevokedBy}",
            Timestamp = DateTime.UtcNow,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                Action = "RoleRevoked",
                Role = domainEvent.Role,
                RevokedBy = domainEvent.RevokedBy
            })
        };

        _dbContext.UserActivities.Add(activity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Role {Role} revoked from user {UserId} by {RevokedBy}",
            domainEvent.Role, domainEvent.UserId, domainEvent.RevokedBy);
    }
}
