using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for validating access token
/// </summary>
public record ValidateTokenRequest(
    [Required(ErrorMessage = "Token is required")]
    string Token,

    List<string>? RequiredPermissions = null,

    List<string>? RequiredRoles = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
