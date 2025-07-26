namespace Contracts.User.Requests;

/// <summary>
/// API request for GetBlockedUsers operation
/// </summary>
public record GetBlockedUsersRequest(
    int PageNumber = 1,
    int PageSize = 12)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
