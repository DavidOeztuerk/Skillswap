using CQRS.Interfaces;

namespace SkillService.Application.Queries;

public record GetSkillCategoriesQuery(
    bool IncludeInactive = false,
    bool IncludeSkillCounts = false)
    : IQuery<List<SkillCategoryResponse>>, ICacheableQuery
{
    public string CacheKey => $"skill-categories:{IncludeInactive}:{IncludeSkillCounts}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(30);
}

public record SkillCategoryResponse(
    string CategoryId,
    string Name,
    string? IconName,
    string? Color);
