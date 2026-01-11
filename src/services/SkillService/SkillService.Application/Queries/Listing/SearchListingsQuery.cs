using Contracts.Listing.Responses;
using CQRS.Interfaces;
using CQRS.Models;
using MediatR;

namespace SkillService.Application.Queries.Listing;

/// <summary>
/// Query to search listings with filters and pagination
/// </summary>
public record SearchListingsQuery(
    string? SearchTerm = null,
    string? CategoryId = null,
    string? TopicId = null,
    string? ListingType = null,
    List<string>? Tags = null,
    decimal? MinRating = null,
    string? LocationType = null,
    int? MaxDistanceKm = null,
    double? UserLatitude = null,
    double? UserLongitude = null,
    bool? BoostedOnly = null,
    string? SortBy = null,
    string? SortDirection = "desc",
    int PageNumber = 1,
    int PageSize = 20)
    : IRequest<PagedResponse<ListingResponse>>, ICacheableQuery
{
  // ICacheableQuery implementation
  // Note: Cache key includes all filter parameters for unique caching per search
  public string CacheKey => $"listings:search:{SearchTerm}:{CategoryId}:{TopicId}:{ListingType}:{MinRating}:{LocationType}:{BoostedOnly}:{SortBy}:{SortDirection}:{PageNumber}:{PageSize}";
  public TimeSpan CacheDuration => TimeSpan.FromMinutes(2); // Short cache for search results
}
