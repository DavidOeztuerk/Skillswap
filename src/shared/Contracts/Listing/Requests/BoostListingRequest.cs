using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Listing.Requests;

/// <summary>
/// API request for boosting a listing (premium visibility)
/// Phase 10: Listing concept with expiration
/// </summary>
public record BoostListingRequest(
    [Required(ErrorMessage = "Listing ID is required")]
    string ListingId,

    /// <summary>
    /// Duration of boost in days (default from settings if not specified)
    /// </summary>
    [Range(1, 30, ErrorMessage = "Boost duration must be between 1 and 30 days")]
    int? DurationDays = null)
    : IVersionedContract
{
    public string ApiVersion => "v1";
}
