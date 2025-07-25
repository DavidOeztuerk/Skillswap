using System.ComponentModel.DataAnnotations;

namespace Contracts.VideoCall.Requests;

/// <summary>
/// API request for EndCall operation
/// </summary>
public record EndCallRequest(
    [Required(ErrorMessage = "Session ID is required")]
    string SessionId,

    [Range(1, int.MaxValue, ErrorMessage = "Duration must be greater than 0")]
    int DurationSeconds,

    [Range(1,5, ErrorMessage = "Rating must be between 1 and 5")]
    int? Rating = null,

    string? Feedback = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
