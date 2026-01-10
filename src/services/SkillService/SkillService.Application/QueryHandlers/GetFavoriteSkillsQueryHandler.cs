using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;
using SkillService.Domain.Repositories;
using SkillService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.QueryHandlers;

public class GetFavoriteSkillsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    IUserServiceClient userServiceClient,
    ILogger<GetFavoriteSkillsQueryHandler> logger)
    : BasePagedQueryHandler<GetFavoriteSkillsQuery, SkillSearchResultResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

    public override async Task<PagedResponse<SkillSearchResultResponse>> Handle(
        GetFavoriteSkillsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting favorite skills for user {UserId}, Page {PageNumber}, Size {PageSize}",
            request.UserId, request.PageNumber, request.PageSize);

        var (skills, totalCount) = await _unitOfWork.SkillFavorites.GetFavoriteSkillsPagedAsync(
            request.UserId,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        // Fetch user profiles for all skill owners
        var userIds = skills.Select(s => s.UserId).Distinct();
        var userProfiles = await _userServiceClient.GetUserProfilesAsync(userIds, cancellationToken);

        Logger.LogDebug("Fetched {ProfileCount} user profiles for {UserCount} unique users",
            userProfiles.Count, userIds.Count());

        // Fetch boost status for all skills (Phase 15)
        var skillIds = skills.Select(s => s.Id).ToList();
        var boostStatusMap = await _unitOfWork.Listings.GetBoostStatusForSkillsAsync(skillIds, cancellationToken);

        // Map to response DTOs
        var skillResponses = skills.Select(s =>
        {
            // Get owner profile if available
            userProfiles.TryGetValue(s.UserId, out var ownerProfile);

            // Get boost status (Phase 15)
            boostStatusMap.TryGetValue(s.Id, out var boostStatus);
            var (isBoosted, isCurrentlyBoosted) = boostStatus;

            return new SkillSearchResultResponse(
                s.Id,
                s.UserId,
                s.Name,
                s.Description,
                s.IsOffered,
                new SkillCategoryResponse(
                    s.Topic?.Id ?? s.SkillTopicId,
                    s.Topic?.FullPath ?? "Unknown",
                    s.Topic?.IconName ?? "",
                    s.Category?.Color ?? "",
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
                null,
                // Boost info (Phase 15)
                isBoosted,
                isCurrentlyBoosted
            );
        }).ToList();

        Logger.LogInformation("Found {TotalCount} favorite skills, returning page {PageNumber} with {Count} results",
            totalCount, request.PageNumber, skillResponses.Count);

        return Success(skillResponses, request.PageNumber, request.PageSize, totalCount);
    }
}
