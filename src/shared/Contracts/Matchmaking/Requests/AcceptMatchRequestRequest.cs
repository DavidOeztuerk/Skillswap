namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for AcceptMatchRequest operation
/// </summary>
public record AcceptMatchRequestRequest(
    string RequestId,
    string? ResponseMessage = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
