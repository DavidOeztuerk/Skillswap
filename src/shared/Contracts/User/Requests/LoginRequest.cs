using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.User.Requests;

/// <summary>
/// API request for user authentication with device fingerprinting
/// </summary>
/// <param name="Email">User's email address</param>
/// <param name="Password">User's password</param>
/// <param name="RememberMe">Whether to extend session duration</param>
/// <param name="TwoFactorCode">Two-factor authentication code (if required)</param>
/// <param name="DeviceId">Device identifier</param>
/// <param name="DeviceInfo">Device information</param>
/// <param name="DeviceFingerprint">Device fingerprint for session tracking</param>
/// <param name="Browser">Browser name</param>
/// <param name="OperatingSystem">Operating system</param>
/// <param name="ScreenResolution">Screen resolution</param>
/// <param name="TimeZone">User's timezone</param>
/// <param name="Language">User's language</param>
/// <param name="IpAddress">Client IP address</param>
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

    string? DeviceInfo = null,

    string? DeviceFingerprint = null,

    string? Browser = null,

    string? OperatingSystem = null,

    string? ScreenResolution = null,

    string? TimeZone = null,

    string? Language = null,

    string? IpAddress = null)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}