using Contracts.User.Responses.LinkedIn;
using CQRS.Interfaces;

namespace UserService.Application.Queries.SocialConnections;

/// <summary>
/// Query to get LinkedIn connection for a user
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record GetLinkedInConnectionQuery : IQuery<LinkedInConnectionResponse>
{
    public required string UserId { get; init; }
}
