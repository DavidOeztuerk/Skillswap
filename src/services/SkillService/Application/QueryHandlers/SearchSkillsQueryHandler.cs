using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Application.Queries;
using System.Text.Json;
using CQRS.Models;
using Contracts.Skill.Responses;

namespace SkillService.Application.QueryHandlers;

public class SearchSkillsQueryHandler(
    SkillDbContext dbContext,
    ILogger<SearchSkillsQueryHandler> logger)
    : BasePagedQueryHandler<SearchSkillsQuery, SkillSearchResultResponse>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    public override async Task<PagedResponse<SkillSearchResultResponse>> Handle(
        SearchSkillsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.Skills
                .AsNoTracking() // Performance: Read-only query
                .Include(s => s.SkillCategory)
                .Include(s => s.ProficiencyLevel)
                .Where(s => s.IsActive && !s.IsDeleted && s.UserId != request.UserId);

            // Apply filters
            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(s =>
                    s.Name.ToLower().Contains(searchTerm) ||
                    s.Description.ToLower().Contains(searchTerm) ||
                    (s.SearchKeywords != null && s.SearchKeywords.Contains(searchTerm)));
            }

            if (!string.IsNullOrEmpty(request.CategoryId))
            {
                query = query.Where(s => s.SkillCategoryId == request.CategoryId);
            }

            if (!string.IsNullOrEmpty(request.ProficiencyLevelId))
            {
                query = query.Where(s => s.ProficiencyLevelId == request.ProficiencyLevelId);
            }

            if (request.IsOffered.HasValue)
            {
                query = query.Where(s => s.IsOffered == request.IsOffered.Value);
            }

            if (request.MinRating.HasValue)
            {
                query = query.Where(s => s.AverageRating >= (double)request.MinRating.Value);
            }

            if (request.Tags != null)
            {
                var tags = string.IsNullOrEmpty(JsonSerializer.Serialize(request.Tags))
                    ? []
                    : request.Tags ?? [];

                foreach (var tag in tags)
                {
                    var tagLower = tag.ToLower();
                    query = query.Where(s => s.TagsJson != null && s.TagsJson.Contains(tagLower));
                }
            }

            // Apply sorting
            query = request.SortBy?.ToLower() switch
            {
                "name" => request.SortDirection == "desc"
                    ? query.OrderByDescending(s => s.Name)
                    : query.OrderBy(s => s.Name),
                "rating" => request.SortDirection == "desc"
                    ? query.OrderByDescending(s => s.AverageRating)
                    : query.OrderBy(s => s.AverageRating),
                "createdat" => request.SortDirection == "desc"
                    ? query.OrderByDescending(s => s.CreatedAt)
                    : query.OrderBy(s => s.CreatedAt),
                "updatedat" => request.SortDirection == "desc"
                    ? query.OrderByDescending(s => s.UpdatedAt)
                    : query.OrderBy(s => s.UpdatedAt),
                "popularity" => request.SortDirection == "desc"
                    ? query.OrderByDescending(s => s.ViewCount + s.MatchCount)
                    : query.OrderBy(s => s.ViewCount + s.MatchCount),
                _ => query.OrderByDescending(s => s.SearchRelevanceScore)
            };

            var totalRecords = await query.CountAsync(cancellationToken);

            var skills = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(s => new SkillSearchResultResponse(
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
                        0 // Count entfernt - N+1 Query Problem vermieden
                     ),
                    new ProficiencyLevelResponse(
                        s.ProficiencyLevel.Id,
                        s.ProficiencyLevel.Level,
                        s.ProficiencyLevel.Rank,
                        s.ProficiencyLevel.Color,
                        0 // Count entfernt - N+1 Query Problem vermieden
                     ),
                    s.TagsJson ?? string.Empty,
                    s.AverageRating,
                    s.ReviewCount,
                    s.EndorsementCount,
                    s.EstimatedDurationMinutes,
                    s.CreatedAt,
                    s.LastViewedAt
                ))
                .ToListAsync(cancellationToken);

            return Success(skills, request.PageNumber, request.PageSize, totalRecords);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error searching skills with query: {Query}", request.SearchTerm);
            return Error("An error occurred while searching skills");
        }
    }
}
