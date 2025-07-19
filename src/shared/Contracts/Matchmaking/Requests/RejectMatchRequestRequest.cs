namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for RejectMatchRequest operation
/// </summary>
public record RejectMatchRequestRequest(
    string RequestId,
    string? ResponseMessage = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
