using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for email verification
/// </summary>
/// <param name="Token">Email verification token</param>
/// <param name="Email">Email address to verify</param>
public record VerifyEmailRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email,

    [Required(ErrorMessage = "Verification token is required")]
    string VerificationToken)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
