using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// Request to assign a role to a user
/// </summary>
public record AssignUserRoleRequest
{
    /// <summary>
    /// The ID of the user to assign the role to
    /// </summary>
    [Required]
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// The role to assign (Admin, User, Moderator, SuperAdmin)
    /// </summary>
    [Required]
    public string Role { get; init; } = string.Empty;

    public string AssignedBy { get; init; } = string.Empty;
}