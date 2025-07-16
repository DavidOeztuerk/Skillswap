namespace Contracts.Common;

/// <summary>
/// Generic paged response for API endpoints that return paginated data
/// </summary>
/// <typeparam name="T">Type of items in the response</typeparam>
/// <param name="Items">List of items for current page</param>
/// <param name="PageNumber">Current page number</param>
/// <param name="PageSize">Number of items per page</param>
/// <param name="TotalCount">Total number of items across all pages</param>
/// <param name="TotalPages">Total number of pages</param>
/// <param name="HasNextPage">Whether there is a next page</param>
/// <param name="HasPreviousPage">Whether there is a previous page</param>
public record PagedResponse<T>(
    List<T> Items,
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