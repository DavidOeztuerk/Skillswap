using CQRS.Interfaces;
using Contracts.Skill.Responses;

namespace SkillService.Application.Queries;

/// <summary>
/// Query to get skill counts for a specific user (public endpoint)
/// </summary>
public record GetUserSkillCountsQuery(string UserId)
    : IQuery<UserSkillCountsResponse>, ICacheableQuery
{
    public string CacheKey => $"user-skill-counts:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}
