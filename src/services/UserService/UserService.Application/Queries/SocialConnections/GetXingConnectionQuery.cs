using Contracts.User.Responses.Xing;
using CQRS.Interfaces;

namespace UserService.Application.Queries.SocialConnections;

/// <summary>
/// Query to get Xing connection for a user
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record GetXingConnectionQuery : IQuery<XingConnectionResponse>
{
    public required string UserId { get; init; }
}
