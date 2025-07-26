using System.ComponentModel.DataAnnotations;

namespace Contracts.VideoCall.Requests;

/// <summary>
/// API request for JoinCall operation
/// </summary>
public record JoinCallRequest(
    [Required(ErrorMessage = "Session ID is required")]
    string SessionId,
    string ConnectionId,
    bool CameraEnabled = true,
    bool MicrophoneEnabled = true,
    string? DeviceInfo = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
