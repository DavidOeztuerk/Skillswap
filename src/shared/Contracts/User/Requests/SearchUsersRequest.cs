using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for searching users with filters and pagination
/// </summary>
/// <param name="SearchTerm">Free text search term</param>
/// <param name="Skills">Filter by user skills</param>
/// <param name="Location">Filter by location</param>
/// <param name="IsAvailable">Filter by availability status</param>
/// <param name="MinRating">Minimum user rating</param>
/// <param name="MaxRating">Maximum user rating</param>
/// <param name="SortBy">Field to sort by</param>
/// <param name="SortDescending">Sort direction</param>
/// <param name="PageNumber">Page number for pagination</param>
/// <param name="PageSize">Number of items per page</param>
public record SearchUsersRequest(
    [StringLength(100, ErrorMessage = "Search term must not exceed 100 characters")]
    string? SearchTerm = null,

    List<string>? Skills = null,

    [StringLength(200, ErrorMessage = "Location must not exceed 200 characters")]
    string? Location = null,

    bool? IsAvailable = null,

    [Range(1, 5, ErrorMessage = "Minimum rating must be between 1 and 5")]
    decimal? MinRating = null,

    [Range(1, 5, ErrorMessage = "Maximum rating must be between 1 and 5")]
    decimal? MaxRating = null,

    [StringLength(50, ErrorMessage = "Sort field must not exceed 50 characters")]
    string? SortBy = "CreatedAt",

    bool SortDescending = true,

    [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0")]
    int PageNumber = 1,

    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
    int PageSize = 20)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}