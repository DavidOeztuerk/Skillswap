using CQRS.Interfaces;
using Contracts.Skill.Responses;

namespace SkillService.Application.Queries;

public record GetSkillCategoriesQuery()
    : IQuery<List<SkillCategoryResponse>>, ICacheableQuery
{
    public string CacheKey => $"skill-categories";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(30);
}
