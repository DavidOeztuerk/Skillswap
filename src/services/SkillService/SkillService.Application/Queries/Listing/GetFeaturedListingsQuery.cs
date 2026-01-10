using Contracts.Listing.Responses;
using CQRS.Interfaces;

namespace SkillService.Application.Queries.Listing;

/// <summary>
/// Query to get featured listings for homepage (Phase 15)
/// Sorted by: Boost status > Rating > Popularity > Recency
/// Public endpoint - no auth required
/// </summary>
public record GetFeaturedListingsQuery(int Limit = 6) : IQuery<List<ListingResponse>>, ICacheableQuery
{
  public string CacheKey => $"listings:featured:{Limit}";
  public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}
