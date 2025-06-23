// ============================================================================
// SKILL SERVICE QUERY HANDLERS - COMPLETE IMPLEMENTATION
// src/services/SkillService/Application/QueryHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;
using Contracts.Users;
using Infrastructure.Services;
using SkillService.Application.Queries;
using System.Text.Json;

namespace SkillService.Application.QueryHandlers;

// ============================================================================
// SKILL RECOMMENDATIONS QUERY HANDLER
// ============================================================================

public class GetSkillRecommendationsQueryHandler(
    SkillDbContext dbContext,
    IUserLookupService userLookup,
    ILogger<GetSkillRecommendationsQueryHandler> logger)
    : BaseQueryHandler<
    GetSkillRecommendationsQuery,
    List<SkillRecommendationResponse>>(
        logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IUserLookupService _userLookup = userLookup;

    public override async Task<ApiResponse<List<SkillRecommendationResponse>>> Handle(
        GetSkillRecommendationsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get user's existing skills to find similar ones
            var userSkills = await _dbContext.Skills
                .Where(s => s.UserId == request.UserId && !s.IsDeleted)
                .Select(s => new { s.SkillCategoryId, s.Tags })
                .ToListAsync(cancellationToken);

            var userCategories = userSkills.Select(s => s.SkillCategoryId).Distinct().ToList();
            var userTags = new List<string>();

            foreach (var skill in userSkills)
            {
                try
                {
                    if (skill.Tags != null && skill.Tags.Count > 0)
                    {
                        userTags.AddRange(skill.Tags);
                    }
                }
                catch
                {
                    // Skip invalid JSON
                }
            }

            var distinctUserTags = userTags.Distinct().ToList();

            // Find recommended skills
            var query = _dbContext.Skills
                .Include(s => s.SkillCategory)
                .Where(s => s.UserId != request.UserId &&
                           s.IsActive &&
                           !s.IsDeleted &&
                           s.IsOffering); // Recommend offered skills

            if (request.OnlyRemote)
            {
                query = query.Where(s => s.IsRemoteAvailable);
            }

            if (!string.IsNullOrEmpty(request.PreferredLocation))
            {
                query = query.Where(s => s.IsRemoteAvailable ||
                                        (s.Location != null && s.Location.Contains(request.PreferredLocation)));
            }

            var candidateSkills = await query
                .Select(s => new
                {
                    s.Id,
                    s.UserId,
                    s.Name,
                    s.Description,
                    s.SkillCategoryId,
                    CategoryName = s.SkillCategory.Name,
                    CategoryColor = s.SkillCategory.Color,
                    CategoryIcon = s.SkillCategory.IconName,
                    s.AverageRating,
                    s.IsRemoteAvailable,
                    s.TagsJson
                })
                .ToListAsync(cancellationToken);

            var recommendations = new List<SkillRecommendationResponse>();

            foreach (var skill in candidateSkills)
            {
                var compatibilityScore = 0.0;
                var reason = "New skill discovery";

                // Category match bonus
                if (userCategories.Contains(skill.SkillCategoryId))
                {
                    compatibilityScore += 0.4;
                    reason = "Similar to your existing skills";
                }

                // Tag match bonus
                try
                {
                    if (!string.IsNullOrEmpty(skill.TagsJson))
                    {
                        var skillTags = JsonSerializer.Deserialize<List<string>>(skill.TagsJson);
                        if (skillTags != null)
                        {
                            var commonTags = skillTags.Intersect(distinctUserTags, StringComparer.OrdinalIgnoreCase).Count();
                            if (commonTags > 0)
                            {
                                compatibilityScore += 0.3 * (commonTags / (double)distinctUserTags.Count);
                                reason = $"Matches {commonTags} of your interests";
                            }
                        }
                    }
                }
                catch
                {
                    // Skip invalid JSON
                }

                // Rating bonus
                if (skill.AverageRating.HasValue && skill.AverageRating.Value >= 4.0)
                {
                    compatibilityScore += 0.2;
                }

                // Remote availability bonus
                if (request.OnlyRemote && skill.IsRemoteAvailable)
                {
                    compatibilityScore += 0.1;
                }

                if (compatibilityScore > 0.2) // Minimum threshold
                {
                    var owner = await _userLookup.GetUserAsync(skill.UserId, cancellationToken);
                    recommendations.Add(new SkillRecommendationResponse(
                        skill.Id,
                        skill.UserId,
                        owner?.FullName ?? string.Empty,
                        skill.Name,
                        skill.Description,
                        new SkillCategoryResponse(
                            skill.SkillCategoryId,
                            skill.CategoryName,
                            null,
                            skill.CategoryIcon,
                            skill.CategoryColor,
                            0,
                            null,
                            true,
                            DateTime.UtcNow),
                        skill.AverageRating,
                        reason,
                        Math.Round(compatibilityScore, 2),
                        skill.IsRemoteAvailable));
                }
            }

            var topRecommendations = recommendations
                .OrderByDescending(r => r.CompatibilityScore)
                .ThenByDescending(r => r.AverageRating ?? 0)
                .Take(request.MaxRecommendations)
                .ToList();

            return Success(topRecommendations);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting skill recommendations for user {UserId}", request.UserId);
            return Error("An error occurred while getting recommendations");
        }
    }
}