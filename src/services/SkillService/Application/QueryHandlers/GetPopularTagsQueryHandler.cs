// ============================================================================
// SKILL SERVICE QUERY HANDLERS - COMPLETE IMPLEMENTATION
// src/services/SkillService/Application/QueryHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;
using SkillService.Application.Queries;

namespace SkillService.Application.QueryHandlers;

// ============================================================================
// GET POPULAR TAGS QUERY HANDLER
// ============================================================================

public class GetPopularTagsQueryHandler(
    SkillDbContext dbContext,
    ILogger<GetPopularTagsQueryHandler> logger)
    : BaseQueryHandler<
    GetPopularTagsQuery,
    List<PopularTagResponse>>(
        logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<List<PopularTagResponse>>> Handle(
        GetPopularTagsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.Skills
                .Where(s => !s.IsDeleted && s.IsActive && !string.IsNullOrEmpty(s.TagsJson));

            if (!string.IsNullOrEmpty(request.CategoryId))
            {
                query = query.Where(s => s.SkillCategoryId == request.CategoryId);
            }

            var skillsWithTags = await query
                .Include(s => s.SkillCategory)
                .Select(s => new { s.TagsJson, CategoryId = s.SkillCategoryId, CategoryName = s.SkillCategory.Name })
                .ToListAsync(cancellationToken);

            var tagUsage = new Dictionary<string, (int count, string? categoryId, string? categoryName)>();

            foreach (var skill in skillsWithTags)
            {
                try
                {
                    var tags = System.Text.Json.JsonSerializer.Deserialize<List<string>>(skill.TagsJson!);
                    if (tags != null)
                    {
                        foreach (var tag in tags)
                        {
                            var key = tag.ToLowerInvariant().Trim();
                            if (tagUsage.ContainsKey(key))
                            {
                                tagUsage[key] = (tagUsage[key].count + 1, skill.CategoryId, skill.CategoryName);
                            }
                            else
                            {
                                tagUsage[key] = (1, skill.CategoryId, skill.CategoryName);
                            }
                        }
                    }
                }
                catch
                {
                    // Skip invalid JSON
                }
            }

            var popularTags = tagUsage
                .Where(x => x.Value.count >= request.MinUsageCount)
                .OrderByDescending(x => x.Value.count)
                .Take(request.MaxTags)
                .Select(x => new PopularTagResponse(
                    x.Key,
                    x.Value.count,
                    x.Value.categoryId,
                    x.Value.categoryName,
                    0.0)) // TODO: Calculate growth rate
                .ToList();

            return Success(popularTags);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting popular tags");
            return Error("An error occurred while retrieving popular tags");
        }
    }
}
