using System.ComponentModel.DataAnnotations;

namespace Contracts.VideoCall.Requests;

/// <summary>
/// API request for EndCall operation
/// </summary>
public record EndCallRequest(
    // TODO: Add request parameters with validation
    string PlaceholderParam)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
