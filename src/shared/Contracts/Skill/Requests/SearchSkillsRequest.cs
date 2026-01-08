using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for searching skills with filters and pagination
/// </summary>
/// <param name="SearchTerm">Free text search term</param>
/// <param name="CategoryId">Filter by skill category</param>
/// <param name="Tags">Filter by skill tags</param>
/// <param name="IsOffered">Filter by offered skills</param>
/// <param name="MinRating">Minimum skill rating</param>
/// <param name="SortBy">Field to sort by</param>
/// <param name="SortDescending">Sort direction</param>
/// <param name="PageNumber">Page number for pagination</param>
/// <param name="PageSize">Number of items per page</param>
public record SearchSkillsRequest(
    [StringLength(100, ErrorMessage = "Search term must not exceed 100 characters")]
    string? SearchTerm = null,

    string? CategoryId = null,

    string[]? Tags = null,

    bool? IsOffered = null,

    [Range(1, 5, ErrorMessage = "Minimum rating must be between 1 and 5")]
    decimal? MinRating = null,

    [StringLength(50, ErrorMessage = "Sort field must not exceed 50 characters")]
    string? SortBy = "CreatedAt",

    string SortDescending = "desc",

    [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0")]
    int PageNumber = 1,

    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
    int PageSize = 20,

    // Location filters
    string? LocationType = null,

    [Range(1, 500, ErrorMessage = "Max distance must be between 1 and 500 km")]
    int? MaxDistanceKm = null,

    double? UserLatitude = null,

    double? UserLongitude = null)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
