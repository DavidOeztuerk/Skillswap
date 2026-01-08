using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Queries.SocialConnections;

/// <summary>
/// Query to get all social connections and imported data for a user
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record GetSocialConnectionsQuery : IQuery<SocialConnectionsResponse>
{
    public required string UserId { get; init; }
}
