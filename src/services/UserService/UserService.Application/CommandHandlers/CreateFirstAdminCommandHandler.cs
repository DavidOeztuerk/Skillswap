using CQRS.Handlers;
using CQRS.Interfaces;
using Infrastructure.Models;
using Infrastructure.Security;
using EventSourcing;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using Events.Domain.User;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;
using Contracts.User.Responses;
using CQRS.Models;

namespace UserService.Application.CommandHandlers;

/// <summary>
/// Handler for creating the first admin user - only works if no admin exists yet
/// </summary>
public class CreateFirstAdminCommandHandler(
    IUserRepository userRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateFirstAdminCommandHandler> logger)
    : BaseCommandHandler<CreateFirstAdminCommand, AssignUserRoleResponse>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<AssignUserRoleResponse>> Handle(
        CreateFirstAdminCommand request,
        CancellationToken cancellationToken)
    {
        if (request.UserId is null) return Error("UserId is required");

        try
        {
            // Check if any admin already exists
            var existingAdmin = await _userRepository.IsAnyAdminExists(cancellationToken);

            if (existingAdmin)
            {
                return Error("Admin user already exists. Use the regular role assignment endpoint.");
            }

            // Check if user exists
            var user = await _userRepository.GetUserWithRoles(request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found");
            }

            // Check if user already has admin role
            var hasAdminRole = await _userRepository.HasRole(request.UserId, Roles.Admin, cancellationToken);

            if (hasAdminRole)
            {
                return Error("User already has admin role");
            }

            // Create admin role assignment
            var userRole = new UserRole
            {
                UserId = request.UserId,
                Role = Roles.Admin,
                AssignedBy = "SYSTEM_BOOTSTRAP", // System assignment
                AssignedAt = DateTime.UtcNow
            };

            await _userRepository.AddUserRole(userRole, cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new UserRoleAssignedDomainEvent(
                request.UserId,
                user.Email,
                Roles.Admin,
                "SYSTEM_BOOTSTRAP"), cancellationToken);

            Logger.LogInformation("First admin role assigned to user {UserId} via bootstrap",
                request.UserId);

            var response = new AssignUserRoleResponse(
                request.UserId,
                Roles.Admin,
                "SYSTEM_BOOTSTRAP",
                DateTime.UtcNow,
                true);

            return Success(response, "First admin user created successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating first admin user {UserId}", request.UserId);
            return Error("An error occurred while creating the first admin user. Please try again.");
        }
    }
}