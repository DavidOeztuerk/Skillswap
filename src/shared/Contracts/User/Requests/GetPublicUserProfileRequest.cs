using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for GetPublicUserProfile operation
/// </summary>
public record GetPublicUserProfileRequest(
    [Required]
    string UserId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
