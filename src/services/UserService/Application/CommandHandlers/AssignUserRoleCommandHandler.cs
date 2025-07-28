using CQRS.Handlers;
using CQRS.Interfaces;
using Infrastructure.Models;
using Infrastructure.Security;
using EventSourcing;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;
using Events.Domain.User;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;
using Contracts.User.Responses;

namespace UserService.Application.CommandHandlers;

/// <summary>
/// Handler for assigning roles to users
/// </summary>
public class AssignUserRoleCommandHandler(
    UserDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<AssignUserRoleCommandHandler> logger)
    : BaseCommandHandler<AssignUserRoleCommand, AssignUserRoleResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<AssignUserRoleResponse>> Handle(
        AssignUserRoleCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate role
            var validRoles = new[] { Roles.Admin, Roles.User, Roles.Moderator, Roles.SuperAdmin };
            if (!validRoles.Contains(request.Role))
            {
                return Error($"Invalid role: {request.Role}. Valid roles are: {string.Join(", ", validRoles)}");
            }

            // Check if user exists
            var user = await _dbContext.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found");
            }

            // Check if user already has this role
            var existingRole = user.UserRoles
                .FirstOrDefault(ur => ur.Role == request.Role && ur.RevokedAt == null && !ur.IsDeleted);

            if (existingRole != null)
            {
                return Error($"User already has the role: {request.Role}");
            }

            // Create new role assignment
            var userRole = new UserRole
            {
                UserId = request.UserId,
                Role = request.Role,
                AssignedBy = request.AssignedBy,
                AssignedAt = DateTime.UtcNow
            };

            user.UserRoles.Add(userRole);
            _dbContext.UserRoles.Add(userRole);

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new UserRoleAssignedDomainEvent(
                request.UserId,
                user.Email,
                request.Role,
                request.AssignedBy), cancellationToken);

            Logger.LogInformation("Role {Role} assigned to user {UserId} by {AssignedBy}",
                request.Role, request.UserId, request.AssignedBy);

            var response = new AssignUserRoleResponse(
                request.UserId,
                request.Role,
                request.AssignedBy,
                DateTime.UtcNow,
                true);

            return Success(response, $"Role {request.Role} successfully assigned to user");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error assigning role {Role} to user {UserId}", 
                request.Role, request.UserId);
            return Error("An error occurred while assigning the role. Please try again.");
        }
    }
}