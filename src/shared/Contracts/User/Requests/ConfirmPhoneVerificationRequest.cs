using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for confirming phone verification with code
/// </summary>
public record ConfirmPhoneVerificationRequest(
    [Required(ErrorMessage = "Verification code is required")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Verification code must be exactly 6 digits")]
    [RegularExpression("^[0-9]{6}$", ErrorMessage = "Verification code must contain only digits")]
    string VerificationCode)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}