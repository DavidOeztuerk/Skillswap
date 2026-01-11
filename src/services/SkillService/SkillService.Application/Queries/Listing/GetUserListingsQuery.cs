using Contracts.Listing.Responses;
using CQRS.Interfaces;

namespace SkillService.Application.Queries.Listing;

/// <summary>
/// Query to get all listings for the current user
/// </summary>
public record GetUserListingsQuery(bool IncludeExpired = false)
    : IQuery<List<ListingResponse>>, ICacheableQuery
{
  public string? UserId { get; set; }

  // ICacheableQuery implementation
  public string CacheKey => $"listings:my-listings:{UserId}:{IncludeExpired}";
  public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}
