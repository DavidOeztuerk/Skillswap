namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for GetUserMatches operation
/// </summary>
public record GetUserMatchesRequest(
    string? Status = null,
    bool IncludeCompleted = true,
    int PageNumber = 1,
    int PageSize = 20)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
