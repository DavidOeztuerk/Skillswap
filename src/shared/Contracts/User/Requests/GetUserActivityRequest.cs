namespace Contracts.User.Requests;

/// <summary>
/// API request for GetUserActivity operation
/// </summary>
public record GetUserActivityRequest(
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? ActivityType = null,
    int PageNumber = 1,
    int PageSize = 50)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
