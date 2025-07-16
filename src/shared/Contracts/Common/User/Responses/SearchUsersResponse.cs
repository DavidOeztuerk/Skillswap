namespace Contracts.User.Responses;

/// <summary>
/// API response for user search results with pagination
/// </summary>
/// <param name="Users">List of user summaries</param>
/// <param name="PageNumber">Current page number</param>
/// <param name="PageSize">Number of items per page</param>
/// <param name="TotalCount">Total number of matching users</param>
/// <param name="TotalPages">Total number of pages</param>
/// <param name="HasNextPage">Whether there is a next page</param>
/// <param name="HasPreviousPage">Whether there is a previous page</param>
public record SearchUsersResponse(
    List<UserSummaryResponse> Users,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages,
    bool HasNextPage,
    bool HasPreviousPage)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}