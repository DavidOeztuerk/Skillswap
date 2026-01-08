using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;
using Contracts.User.Responses;
using SkillService.Domain.Repositories;
using SkillService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.QueryHandlers;

public class SearchSkillsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    IUserServiceClient userServiceClient,
    ILogger<SearchSkillsQueryHandler> logger)
    : BasePagedQueryHandler<SearchSkillsQuery, SkillSearchResultResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

    public override async Task<PagedResponse<SkillSearchResultResponse>> Handle(
        SearchSkillsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Searching skills with filters: SearchTerm={SearchTerm}, CategoryId={CategoryId}, PageNumber={PageNumber}, PageSize={PageSize}",
            request.SearchTerm, request.CategoryId, request.PageNumber, request.PageSize);

        // Use repository method for complex search
        var (skills, totalCount) = await _unitOfWork.Skills.SearchSkillsPagedAsync(
            request.UserId,
            request.SearchTerm,
            request.CategoryId,
            request.Tags,
            request.IsOffered,
            request.MinRating,
            request.SortBy,
            request.SortDirection,
            request.PageNumber,
            request.PageSize,
            request.LocationType,
            request.MaxDistanceKm,
            request.UserLatitude,
            request.UserLongitude,
            cancellationToken);

        // Fetch user profiles for all skill owners
        var userIds = skills.Select(s => s.UserId).Distinct();
        var userProfiles = await _userServiceClient.GetUserProfilesAsync(userIds, cancellationToken);

        Logger.LogDebug("Fetched {ProfileCount} user profiles for {UserCount} unique users",
            userProfiles.Count, userIds.Count());

        // Calculate experience years once for filtering and response mapping (Phase 5)
        var userExperienceMap = CalculateUserExperienceYears(userProfiles);

        // Apply experience filter if specified (Phase 5)
        // Note: Experience filtering is applied post-query since experience data is in UserService
        // The total count is adjusted to reflect the filtered results
        if (request.MinExperienceYears.HasValue || request.MaxExperienceYears.HasValue)
        {
            var filteredSkills = skills.Where(s =>
            {
                if (!userExperienceMap.TryGetValue(s.UserId, out var years))
                    return false; // Exclude skills from users without profile/experience data

                if (request.MinExperienceYears.HasValue && years < request.MinExperienceYears.Value)
                    return false;

                if (request.MaxExperienceYears.HasValue && years > request.MaxExperienceYears.Value)
                    return false;

                return true;
            }).ToList();

            // Update total count to reflect experience-filtered results
            var removedCount = skills.Count - filteredSkills.Count;
            totalCount = Math.Max(0, totalCount - removedCount);
            skills = filteredSkills;

            Logger.LogDebug("After experience filter: {Count} skills remain (min: {Min}, max: {Max})",
                skills.Count, request.MinExperienceYears, request.MaxExperienceYears);
        }

        // Map to response DTOs
        var skillResponses = skills.Select(s =>
        {
            // Get owner profile if available
            userProfiles.TryGetValue(s.UserId, out var ownerProfile);
            userExperienceMap.TryGetValue(s.UserId, out var ownerExperienceYears);

            return new SkillSearchResultResponse(
                s.Id,
                s.UserId,
                s.Name,
                s.Description,
                s.IsOffered,
                new SkillCategoryResponse(
                    s.SkillCategory.Id,
                    s.SkillCategory.Name,
                    s.SkillCategory.IconName,
                    s.SkillCategory.Color,
                    0 // Count removed to avoid N+1 query
                ),
                s.TagsJson ?? string.Empty,
                s.AverageRating,
                s.ReviewCount,
                s.EndorsementCount,
                s.EstimatedDurationMinutes,
                s.CreatedAt,
                s.LastViewedAt,
                // Location fields
                s.LocationType,
                s.LocationCity,
                s.LocationCountry,
                s.MaxDistanceKm,
                // Owner info from user profile
                ownerProfile?.UserName,
                ownerProfile?.FirstName,
                ownerProfile?.LastName,
                // Owner experience (Phase 5)
                ownerExperienceYears
            );
        }).ToList();

        Logger.LogInformation("Found {TotalCount} skills, returning page {PageNumber} with {Count} results",
            totalCount, request.PageNumber, skillResponses.Count);

        return Success(skillResponses, request.PageNumber, request.PageSize, totalCount);
    }

    /// <summary>
    /// Calculate total experience years for each user from their experience entries (Phase 5)
    /// </summary>
    private static Dictionary<string, int> CalculateUserExperienceYears(
        Dictionary<string, PublicUserProfileResponse> userProfiles)
    {
        var result = new Dictionary<string, int>();

        foreach (var (userId, profile) in userProfiles)
        {
            if (profile.Experience == null || profile.Experience.Count == 0)
            {
                result[userId] = 0;
                continue;
            }

            var totalMonths = 0;
            foreach (var exp in profile.Experience)
            {
                var endDate = exp.EndDate ?? DateTime.UtcNow;
                var months = ((endDate.Year - exp.StartDate.Year) * 12) + endDate.Month - exp.StartDate.Month;
                totalMonths += Math.Max(0, months);
            }

            result[userId] = totalMonths / 12;
        }

        return result;
    }
}
