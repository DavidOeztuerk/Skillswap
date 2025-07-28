using CQRS.Interfaces;
using Contracts.User.Responses;

namespace UserService.Application.Commands;

/// <summary>
/// Command to create the first admin user - only works if no admin exists yet
/// </summary>
/// <param name="UserId">The ID of the user to make admin</param>
public record CreateFirstAdminCommand(string UserId) : ICommand<AssignUserRoleResponse>;