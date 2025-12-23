using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.QueryHandlers;

public class GetPopularTagsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<GetPopularTagsQueryHandler> logger)
    : BaseQueryHandler<
    GetPopularTagsQuery,
    List<PopularTagResponse>>(
        logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<List<PopularTagResponse>>> Handle(
        GetPopularTagsQuery request,
        CancellationToken cancellationToken)
    {
        {
            // Get skills with tags
            var skillsWithTags = await _unitOfWork.Skills
                .GetActiveSkillsWithTagsAsync(request.CategoryId, cancellationToken);

            var skillTagData = new List<(string TagsJson, string CategoryId, string CategoryName)>();

            foreach (var skill in skillsWithTags)
            {
                var category = await _unitOfWork.SkillCategories.GetByIdAsync(skill.SkillCategoryId, cancellationToken);
                skillTagData.Add((skill.TagsJson ?? "", skill.SkillCategoryId, category?.Name ?? "Unknown"));
            }

            var tagUsage = new Dictionary<string, (int count, string? categoryId, string? categoryName)>();

            foreach (var skill in skillTagData)
            {
                if (!string.IsNullOrEmpty(skill.TagsJson))
                {
                    var tags = System.Text.Json.JsonSerializer.Deserialize<List<string>>(skill.TagsJson);
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
    }
}
