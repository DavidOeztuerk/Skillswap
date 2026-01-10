using Contracts.Listing.Responses;
using CQRS.Interfaces;

namespace SkillService.Application.Queries.Listing;

/// <summary>
/// Query to get all listings for the current user
/// Phase 10: Listing concept with expiration
/// </summary>
public record GetUserListingsQuery(bool IncludeExpired = false)
    : IQuery<List<ListingResponse>>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
