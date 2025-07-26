using System.ComponentModel.DataAnnotations;

namespace Contracts.VideoCall.Requests;

/// <summary>
/// API request for StartCall operation
/// </summary>
public record StartCallRequest(
    [Required(ErrorMessage = "Session ID is required")]
    string SessionId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
