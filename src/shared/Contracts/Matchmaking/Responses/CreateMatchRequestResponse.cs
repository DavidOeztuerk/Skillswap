namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for CreateMatchRequest operation
/// </summary>
public record CreateMatchRequestResponse(
    string RequestId,
    string Status,
    DateTime CreatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
