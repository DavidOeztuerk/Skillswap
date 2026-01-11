using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Listing.Requests;

/// <summary>
/// API request for refreshing a listing (extending expiration)
/// </summary>
public record RefreshListingRequest(
    [Required(ErrorMessage = "Listing ID is required")]
    string ListingId)
    : IVersionedContract
{
  public string ApiVersion => "v1";
}
