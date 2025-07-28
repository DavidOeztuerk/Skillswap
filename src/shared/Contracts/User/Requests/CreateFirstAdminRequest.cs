using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// Request to create the first admin user - only works if no admin exists yet
/// </summary>
public record CreateFirstAdminRequest
{
    /// <summary>
    /// The ID of the user to make the first admin
    /// </summary>
    [Required]
    public string UserId { get; init; } = string.Empty;
}