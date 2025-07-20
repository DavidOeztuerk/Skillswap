using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for user authentication
/// </summary>
/// <param name="Email">User's email address</param>
/// <param name="Password">User's password</param>
/// <param name="RememberMe">Whether to extend session duration</param>
/// <param name="TwoFactorCode">Two-factor authentication code (if required)</param>
public record LoginRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email,

    [Required(ErrorMessage = "Password is required")]
    string Password,

    bool RememberMe = false,

    [StringLength(10, ErrorMessage = "Two-factor code must not exceed 10 characters")]
    string? TwoFactorCode = null,

    string? DeviceId = null,

    string? DeviceInfo = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}