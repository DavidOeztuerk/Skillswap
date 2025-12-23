using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.QueryHandlers;

public class SearchSkillsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SearchSkillsQueryHandler> logger)
    : BasePagedQueryHandler<SearchSkillsQuery, SkillSearchResultResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

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
            request.ProficiencyLevelId,
            request.Tags,
            request.IsOffered,
            request.MinRating,
            request.SortBy,
            request.SortDirection,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        // Map to response DTOs
        var skillResponses = skills.Select(s => new SkillSearchResultResponse(
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
            new ProficiencyLevelResponse(
                s.ProficiencyLevel.Id,
                s.ProficiencyLevel.Level,
                s.ProficiencyLevel.Rank,
                s.ProficiencyLevel.Color,
                0 // Count removed to avoid N+1 query
            ),
            s.TagsJson ?? string.Empty,
            s.AverageRating,
            s.ReviewCount,
            s.EndorsementCount,
            s.EstimatedDurationMinutes,
            s.CreatedAt,
            s.LastViewedAt
        )).ToList();

        Logger.LogInformation("Found {TotalCount} skills, returning page {PageNumber} with {Count} results",
            totalCount, request.PageNumber, skillResponses.Count);

        return Success(skillResponses, request.PageNumber, request.PageSize, totalCount);
    }
}
