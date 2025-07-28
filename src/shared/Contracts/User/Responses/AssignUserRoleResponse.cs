namespace Contracts.User.Responses;

/// <summary>
/// Response for user role assignment
/// </summary>
/// <param name="UserId">The ID of the user who was assigned the role</param>
/// <param name="Role">The role that was assigned</param>
/// <param name="AssignedBy">The ID of the user who assigned the role</param>
/// <param name="AssignedAt">When the role was assigned</param>
/// <param name="Success">Whether the assignment was successful</param>
public record AssignUserRoleResponse(
    string UserId,
    string Role,
    string AssignedBy,
    DateTime AssignedAt,
    bool Success);