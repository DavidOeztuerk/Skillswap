namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for CreateMatchRequest operation - display-focused
/// </summary>
public record CreateMatchRequestResponse(
    string RequestId,
    string Status,
    DateTime CreatedAt,
    string ThreadId)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
