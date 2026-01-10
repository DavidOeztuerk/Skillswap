using CQRS.Handlers;
using SkillService.Application.Queries;
using System.Text.Json;
using CQRS.Models;
using Contracts.Skill.Responses;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace SkillService.Application.QueryHandlers;

public class GetSkillRecommendationsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<GetSkillRecommendationsQueryHandler> logger)
    : BaseQueryHandler<GetSkillRecommendationsQuery, List<SkillRecommendationResponse>>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<List<SkillRecommendationResponse>>> Handle(
        GetSkillRecommendationsQuery request,
        CancellationToken cancellationToken)
    {
        // Get user's existing skills to find similar ones
        var userSkills = await _unitOfWork.Skills.GetUserSkillsAsync(request.UserId, cancellationToken);

        var userTopicIds = userSkills.Select(s => s.SkillTopicId).Distinct().ToList();
        var userTags = new List<string>();

        foreach (var skill in userSkills)
        {
            if (!string.IsNullOrEmpty(skill.TagsJson))
            {
                var tags = JsonSerializer.Deserialize<List<string>>(skill.TagsJson);
                if (tags != null && tags.Count > 0)
                {
                    userTags.AddRange(tags);
                }
            }
        }

        var distinctUserTags = userTags.Distinct().ToList();

        // Find recommended skills - use repository method
        var (candidateSkills, _) = await _unitOfWork.Skills.SearchSkillsPagedAsync(
            request.UserId, // Exclude user's own skills
            null, // No search term
            null, // All categories
            null, // No tag filter
            true, // Only offered skills
            null, // No rating filter
            "rating", // Sort by rating
            "desc",
            1,
            100, // Get top 100 candidates
            // Location filters - not used for recommendations
            null, // locationType
            null, // maxDistanceKm
            null, // userLatitude
            null, // userLongitude
            cancellationToken);

        var recommendations = new List<SkillRecommendationResponse>();

        foreach (var skill in candidateSkills)
        {
            var compatibilityScore = 0.0;
            var reason = "New skill discovery";

            // Topic match bonus
            if (userTopicIds.Contains(skill.SkillTopicId))
            {
                compatibilityScore += 0.4;
                reason = "Similar to your existing skills";
            }

            // Tag match bonus
            if (!string.IsNullOrEmpty(skill.TagsJson))
            {
                var skillTags = JsonSerializer.Deserialize<List<string>>(skill.TagsJson);
                if (skillTags != null && distinctUserTags.Count > 0)
                {
                    var commonTags = skillTags.Intersect(distinctUserTags, StringComparer.OrdinalIgnoreCase).Count();
                    if (commonTags > 0)
                    {
                        compatibilityScore += 0.3 * (commonTags / (double)distinctUserTags.Count);
                        reason = $"Matches {commonTags} of your interests";
                    }
                }
            }

            // Rating bonus
            if (skill.AverageRating >= 4.0)
            {
                compatibilityScore += 0.2;
            }

            if (compatibilityScore > 0.2) // Minimum threshold
            {
                recommendations.Add(new SkillRecommendationResponse(
                    skill.Id,
                    skill.UserId,
                    skill.Name,
                    skill.Description,
                    new SkillCategoryResponse(
                        skill.Topic?.Id ?? skill.SkillTopicId,
                        skill.Topic?.FullPath ?? "Unknown",
                        skill.Topic?.IconName ?? "",
                        skill.Category?.Color ?? "",
                        0),
                    skill.AverageRating,
                    reason,
                    Math.Round(compatibilityScore, 2)));
            }
        }

        var topRecommendations = recommendations
            .OrderByDescending(r => r.CompatibilityScore)
            .ThenByDescending(r => r.AverageRating)
            .Take(request.MaxRecommendations)
            .ToList();

        return Success(topRecommendations);
    }
}
