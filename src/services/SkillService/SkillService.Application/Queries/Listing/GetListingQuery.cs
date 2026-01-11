using Contracts.Listing.Responses;
using CQRS.Interfaces;

namespace SkillService.Application.Queries.Listing;

/// <summary>
/// Query to get a listing by ID
/// </summary>
public record GetListingQuery(string ListingId) : IQuery<ListingResponse>, ICacheableQuery
{
  // ICacheableQuery implementation
  public string CacheKey => $"listings:{ListingId}";
  public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
}
