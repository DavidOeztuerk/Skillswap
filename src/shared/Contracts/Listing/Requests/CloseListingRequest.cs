using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Listing.Requests;

/// <summary>
/// API request for closing a listing manually
/// </summary>
public record CloseListingRequest(
    [Required(ErrorMessage = "Listing ID is required")]
    string ListingId,

    /// <summary>
    /// Optional reason for closing the listing
    /// </summary>
    [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    string? Reason = null)
    : IVersionedContract
{
  public string ApiVersion => "v1";
}
