using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Listing.Requests;

/// <summary>
/// API request for searching listings
/// Phase 10: Listing concept with expiration
/// </summary>
public record SearchListingsRequest(
    /// <summary>
    /// Search term for skill name/description
    /// </summary>
    string? SearchTerm = null,

    /// <summary>
    /// Filter by category ID
    /// </summary>
    string? CategoryId = null,

    /// <summary>
    /// Filter by topic ID
    /// </summary>
    string? TopicId = null,

    /// <summary>
    /// Filter by listing type: 'Offer' or 'Request'
    /// </summary>
    [RegularExpression("^(Offer|Request)?$", ErrorMessage = "Type must be 'Offer' or 'Request'")]
    string? ListingType = null,

    /// <summary>
    /// Filter by tags (comma-separated)
    /// </summary>
    string? Tags = null,

    /// <summary>
    /// Minimum rating filter
    /// </summary>
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    decimal? MinRating = null,

    /// <summary>
    /// Location type filter: 'remote', 'in_person', 'both'
    /// </summary>
    string? LocationType = null,

    /// <summary>
    /// Maximum distance in km (for in_person/both)
    /// </summary>
    [Range(1, 500, ErrorMessage = "Distance must be between 1 and 500 km")]
    int? MaxDistanceKm = null,

    /// <summary>
    /// User latitude for distance calculation
    /// </summary>
    double? UserLatitude = null,

    /// <summary>
    /// User longitude for distance calculation
    /// </summary>
    double? UserLongitude = null,

    /// <summary>
    /// Only show boosted listings
    /// </summary>
    bool? BoostedOnly = null,

    /// <summary>
    /// Sort by: 'name', 'rating', 'createdat', 'expiresat', 'popularity'
    /// </summary>
    string? SortBy = null,

    /// <summary>
    /// Sort direction: 'asc' or 'desc'
    /// </summary>
    string? SortDirection = "desc",

    /// <summary>
    /// Page number (1-based)
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Page number must be positive")]
    int PageNumber = 1,

    /// <summary>
    /// Page size
    /// </summary>
    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
    int PageSize = 20)
    : IVersionedContract
{
    public string ApiVersion => "v1";
}
