namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for EndCall operation
/// </summary>
public record EndCallResponse(
    string SessionId,
    DateTime EndedAt,
    int DurationSeconds,
    int? Rating)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
