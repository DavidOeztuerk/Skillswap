using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Queries.SocialConnections;

/// <summary>
/// Query to get all imported skills for a user
/// </summary>
public record GetUserImportedSkillsQuery : IQuery<List<UserImportedSkillResponse>>
{
    public required string UserId { get; init; }
}
