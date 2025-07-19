using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for retrieving user profile information
/// </summary>
/// <param name="UserId">ID of the user to retrieve profile for</param>
public record GetUserProfileRequest(
    [Required(ErrorMessage = "User ID is required")]
    string UserId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}