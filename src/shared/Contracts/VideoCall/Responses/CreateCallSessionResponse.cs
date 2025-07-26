namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for CreateCallSession operation
/// </summary>
public record CreateCallSessionResponse(
    string SessionId,
    string Status,
    DateTime CreatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
