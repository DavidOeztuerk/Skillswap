using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for user registration
/// </summary>
/// <param name="Email">User's email address</param>
/// <param name="Password">User's password</param>
/// <param name="FirstName">User's first name</param>
/// <param name="LastName">User's last name</param>
/// <param name="UserName">User's username</param>
/// <param name="ReferralCode">Optional referral code</param>
public record RegisterUserRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(256, ErrorMessage = "Email must not exceed 256 characters")]
    string Email,

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 100 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$", 
        ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character")]
    string Password,

    [Required(ErrorMessage = "First name is required")]
    [StringLength(100, ErrorMessage = "First name must not exceed 100 characters")]
    [RegularExpression(@"^[a-zA-ZäöüÄÖÜß\s\-']+$", ErrorMessage = "First name contains invalid characters")]
    string FirstName,

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(100, ErrorMessage = "Last name must not exceed 100 characters")]
    [RegularExpression(@"^[a-zA-ZäöüÄÖÜß\s\-']+$", ErrorMessage = "Last name contains invalid characters")]
    string LastName,

    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
    [RegularExpression(@"^[a-zA-Z0-9._-]+$", ErrorMessage = "Username can only contain letters, numbers, dots, underscores, and hyphens")]
    string UserName,

    [StringLength(50, ErrorMessage = "Referral code must not exceed 50 characters")]
    string? ReferralCode = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}