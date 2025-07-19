using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for resetting password with token
/// </summary>
public record ResetPasswordRequest
{
    [Required(ErrorMessage = "Reset token is required")]
    public string Token { get; init; } = default!;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; init; } = default!;

    [Required(ErrorMessage = "New password is required")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 100 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$", 
        ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character")]
    public string NewPassword { get; init; } = default!;

    [Required(ErrorMessage = "Password confirmation is required")]
    [Compare("NewPassword", ErrorMessage = "Password and confirmation do not match")]
    public string ConfirmPassword { get; init; } = default!;

    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
