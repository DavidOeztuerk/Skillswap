using Contracts.User.Responses.Auth;

namespace Contracts.User.Requests;

/// <summary>
/// API request for searching users with filters and pagination
/// </summary>
/// <param name="SearchTerm">Free text search term</param>
/// <param name="IsAvailable">Filter by availability status</param>
/// <param name="MinRating">Minimum user rating</param>
/// <param name="SortBy">Field to sort by</param>
/// <param name="SortDescending">Sort direction</param>
/// <param name="EmailVerified">Filter by email verification status</param>
/// <param name="Role">Filter by user role</param>
/// <param name="AccountStatus">Filter by account status</param>
/// <param name="CreatedAfter">Filter users created after this date</param>
/// <param name="CreatedBefore">Filter users created before this date</param>
/// <param name="PageNumber">Page number for pagination</param>
/// <param name="PageSize">Number of items per page</param>
public record SearchUsersRequest(
    string? SearchTerm = null,
    bool? IsAvailable = null,
    decimal? MinRating = null,
    string? SortBy = "CreatedAt",
    bool SortDescending = true,
    bool? EmailVerified = null,
    string? Role = null,
    AccountStatus? AccountStatus = null,
    DateTime? CreatedAfter = null,
    DateTime? CreatedBefore = null,
    int PageNumber = 1,
    int PageSize = 20)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
