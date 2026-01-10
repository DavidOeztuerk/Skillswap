using Contracts.Listing.Responses;
using CQRS.Interfaces;

namespace SkillService.Application.Queries.Listing;

/// <summary>
/// Query to get a listing by ID
/// Phase 10: Listing concept with expiration
/// </summary>
public record GetListingQuery(string ListingId) : IQuery<ListingResponse>;
