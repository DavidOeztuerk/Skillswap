namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for RejectMatchRequest operation
/// </summary>
public record RejectMatchRequestResponse(
    string RequestId,
    bool Success,
    DateTime RejectedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
