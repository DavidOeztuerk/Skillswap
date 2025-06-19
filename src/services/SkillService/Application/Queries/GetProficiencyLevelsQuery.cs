using CQRS.Interfaces;

namespace SkillService.Application.Queries;

// ============================================================================
// GET PROFICIENCY LEVELS QUERY
// ============================================================================

public record GetProficiencyLevelsQuery(
    bool IncludeInactive = false,
    bool IncludeSkillCounts = false)
    : IQuery<List<ProficiencyLevelResponse>>, ICacheableQuery
{
    public string CacheKey => $"proficiency-levels:{IncludeInactive}:{IncludeSkillCounts}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(30);
}

public record ProficiencyLevelResponse(
    string LevelId,
    string Level,
    string? Description,
    int Rank,
    string? Color,
    int? SkillCount,
    bool IsActive,
    DateTime CreatedAt);
