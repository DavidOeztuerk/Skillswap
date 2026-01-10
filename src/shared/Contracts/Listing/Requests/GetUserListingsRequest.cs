using Contracts.Common;

namespace Contracts.Listing.Requests;

/// <summary>
/// API request for getting user's listings
/// Phase 10: Listing concept with expiration
/// </summary>
public record GetUserListingsRequest(
    /// <summary>
    /// Include expired listings (default: false)
    /// </summary>
    bool IncludeExpired = false)
    : IVersionedContract
{
    public string ApiVersion => "v1";
}
