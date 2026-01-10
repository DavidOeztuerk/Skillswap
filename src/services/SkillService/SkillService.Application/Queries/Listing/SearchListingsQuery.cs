using Contracts.Listing.Responses;
using CQRS.Models;
using MediatR;

namespace SkillService.Application.Queries.Listing;

/// <summary>
/// Query to search listings with filters and pagination
/// Phase 10: Listing concept with expiration
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
    : IRequest<PagedResponse<ListingResponse>>;
