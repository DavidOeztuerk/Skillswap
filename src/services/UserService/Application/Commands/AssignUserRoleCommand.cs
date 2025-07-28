using CQRS.Interfaces;
using Contracts.User.Responses;

namespace UserService.Application.Commands;

/// <summary>
/// Command to assign a role to a user
/// </summary>
/// <param name="UserId">The ID of the user to assign the role to</param>
/// <param name="Role">The role to assign (Admin, User, Moderator, SuperAdmin)</param>
/// <param name="AssignedBy">The ID of the user assigning the role</param>
public record AssignUserRoleCommand(
    string UserId,
    string Role,
    string AssignedBy) : ICommand<AssignUserRoleResponse>;