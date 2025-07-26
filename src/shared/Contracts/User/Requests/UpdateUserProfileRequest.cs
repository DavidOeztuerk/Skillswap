using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for updating user profile information
/// </summary>
/// <param name="FirstName">Updated first name</param>
/// <param name="LastName">Updated last name</param>
/// <param name="PhoneNumber">Updated phone number</param>
/// <param name="Bio">Updated biography</param>
/// <param name="TimeZone">Updated timezone</param>
/// <param name="Location">Updated location</param>
/// <param name="Preferences">Updated user preferences</param>
public record UpdateUserProfileRequest(
    [StringLength(100, ErrorMessage = "First name must not exceed 100 characters")]
    [RegularExpression(@"^[a-zA-ZäöüÄÖÜß\s\-']+$", ErrorMessage = "First name contains invalid characters")]
    string? FirstName = null,

    [StringLength(100, ErrorMessage = "Last name must not exceed 100 characters")]
    [RegularExpression(@"^[a-zA-ZäöüÄÖÜß\s\-']+$", ErrorMessage = "Last name contains invalid characters")]
    string? LastName = null,

    string? UserName = null,

    [Phone(ErrorMessage = "Invalid phone number format")]
    string? PhoneNumber = null,

    [StringLength(500, ErrorMessage = "Bio must not exceed 500 characters")]
    string? Bio = null,

    [StringLength(50, ErrorMessage = "Timezone must not exceed 50 characters")]
    string? TimeZone = null,

    [StringLength(200, ErrorMessage = "Location must not exceed 200 characters")]
    string? Location = null,

    Dictionary<string, string>? Preferences = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}