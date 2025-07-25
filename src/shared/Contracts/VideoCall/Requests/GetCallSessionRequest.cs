using System.ComponentModel.DataAnnotations;

namespace Contracts.VideoCall.Requests;

/// <summary>
/// API request for GetCallSession operation
/// </summary>
public record GetCallSessionRequest(
    [Required(ErrorMessage = "Session ID is required")]
    string SessionId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
