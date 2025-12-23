using Contracts.Skill.Responses;
using CQRS.Interfaces;

namespace SkillService.Application.Queries;

public record GetProficiencyLevelsQuery(
    bool IncludeInactive = false,
    bool IncludeSkillCounts = false)
    : IQuery<List<ProficiencyLevelResponse>>, ICacheableQuery
{
    public string CacheKey => $"proficiency-levels:{IncludeInactive}:{IncludeSkillCounts}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(30);
}
