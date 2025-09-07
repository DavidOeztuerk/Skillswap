using CQRS.Handlers;
using EventSourcing;
using UserService.Application.Commands;
using Events.Domain.User;
using Microsoft.Extensions.Logging;
using Contracts.User.Responses;
using CQRS.Models;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers;

/// <summary>
/// Handler for assigning roles to users
/// </summary>
public class AssignUserRoleCommandHandler(
    IUserRepository userReposiory,
    IDomainEventPublisher eventPublisher,
    ILogger<AssignUserRoleCommandHandler> logger)
    : BaseCommandHandler<AssignUserRoleCommand, AssignUserRoleResponse>(logger)
{
    private readonly IUserRepository userReposiory = userReposiory;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<AssignUserRoleResponse>> Handle(
        AssignUserRoleCommand request,
        CancellationToken cancellationToken)
    {
        if (request.UserId is null) throw new BusinessRuleViolationException("ERR_1002", "UserIdRequired", "UserId is required");

        // Validate role
        var validRoles = new[] { "Admin", "User", "Moderator", "SuperAdmin" };
        if (!validRoles.Contains(request.Role))
        {
            throw new BusinessRuleViolationException("ERR_1001", "InvalidRole", $"Invalid role: {request.Role}. Valid roles are: {string.Join(", ", validRoles)}");
        }

        // Check if user already has this role
        var hasRole = await userReposiory.HasRole(request.UserId, request.Role, cancellationToken);

        if (hasRole)
        {
            throw new ResourceAlreadyExistsException("UserRole", "role", request.Role, $"User already has the role: {request.Role}");
        }

        // Assign the role using repository
        await userReposiory.AssignUserRole(request.UserId, request.Role, request.AssignedBy, cancellationToken);

        // Get user email for event
        var user = await userReposiory.GetUserById(request.UserId, cancellationToken);

        // Publish domain event
        await _eventPublisher.Publish(new UserRoleAssignedDomainEvent(
            request.UserId,
            user?.Email ?? "",
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
}