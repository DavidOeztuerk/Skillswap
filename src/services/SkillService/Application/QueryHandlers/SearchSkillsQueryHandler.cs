using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;
using Contracts.Users;
using SkillService.Application.Queries;
using System.Text.Json;

namespace SkillService.Application.QueryHandlers;

public class SearchSkillsQueryHandler(
    SkillDbContext dbContext,
    IUserLookupService userLookup,
    ILogger<SearchSkillsQueryHandler> logger)
    : BasePagedQueryHandler<
    SearchSkillsQuery,
    SkillSearchResultResponse>(
        logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IUserLookupService _userLookup = userLookup;

    public override async Task<PagedResponse<SkillSearchResultResponse>> Handle(
        SearchSkillsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.Skills
                .Include(s => s.SkillCategory)
                .Include(s => s.ProficiencyLevel)
                .Where(s => s.IsActive && !s.IsDeleted);

            // Apply filters
            if (!string.IsNullOrEmpty(request.Query))
            {
                var searchTerm = request.Query.ToLower();
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

            if (request.IsOffering.HasValue)
            {
                query = query.Where(s => s.IsOffering == request.IsOffering.Value);
            }

            if (request.RemoteOnly == true)
            {
                query = query.Where(s => s.IsRemoteAvailable);
            }

            if (request.MinRating.HasValue)
            {
                query = query.Where(s => s.AverageRating >= request.MinRating.Value);
            }

            if (request.TagsJson != null)
            {

                var tags = string.IsNullOrEmpty(request.TagsJson)
                    ? []
                    : JsonSerializer.Deserialize<List<string>>(request.TagsJson) ?? new List<string>();

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
                "created" => request.SortDirection == "desc"
                    ? query.OrderByDescending(s => s.CreatedAt)
                    : query.OrderBy(s => s.CreatedAt),
                "updated" => request.SortDirection == "desc"
                    ? query.OrderByDescending(s => s.UpdatedAt)
                    : query.OrderBy(s => s.UpdatedAt),
                "popularity" => request.SortDirection == "desc"
                    ? query.OrderByDescending(s => s.ViewCount + s.MatchCount)
                    : query.OrderBy(s => s.ViewCount + s.MatchCount),
                _ => query.OrderByDescending(s => s.SearchRelevanceScore)
            };

            var totalRecords = await query.CountAsync(cancellationToken);

            var rawSkills = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(s => new
                {
                    s.Id,
                    s.UserId,
                    s.Name,
                    s.Description,
                    s.IsOffering,
                    Category = new
                    {
                        s.SkillCategory.Id,
                        s.SkillCategory.Name,
                        s.SkillCategory.Description,
                        s.SkillCategory.IconName,
                        s.SkillCategory.Color,
                        s.SkillCategory.SortOrder,
                        s.SkillCategory.IsActive,
                        s.SkillCategory.CreatedAt
                    },
                    Proficiency = new
                    {
                        s.ProficiencyLevel.Id,
                        s.ProficiencyLevel.Level,
                        s.ProficiencyLevel.Description,
                        s.ProficiencyLevel.Rank,
                        s.ProficiencyLevel.Color,
                        s.ProficiencyLevel.IsActive,
                        s.ProficiencyLevel.CreatedAt
                    },
                    s.TagsJson,
                    s.AverageRating,
                    s.ReviewCount,
                    s.EndorsementCount,
                    s.Location,
                    s.IsRemoteAvailable,
                    s.EstimatedDurationMinutes,
                    s.CreatedAt,
                    s.LastViewedAt
                })
                .ToListAsync(cancellationToken);

            var skills = new List<SkillSearchResultResponse>();
            foreach (var s in rawSkills)
            {
                var user = await _userLookup.GetUserAsync(s.UserId, cancellationToken);
                skills.Add(new SkillSearchResultResponse(
                    s.Id,
                    s.UserId,
                    user?.FullName ?? string.Empty,
                    s.Name,
                    s.Description,
                    s.IsOffering,
                    new SkillCategoryResponse(
                        s.Category.Id,
                        s.Category.Name,
                        s.Category.Description,
                        s.Category.IconName,
                        s.Category.Color,
                        s.Category.SortOrder,
                        null,
                        s.Category.IsActive,
                        s.Category.CreatedAt),
                    new ProficiencyLevelResponse(
                        s.Proficiency.Id,
                        s.Proficiency.Level,
                        s.Proficiency.Description,
                        s.Proficiency.Rank,
                        s.Proficiency.Color,
                        null,
                        s.Proficiency.IsActive,
                        s.Proficiency.CreatedAt),
                    s.TagsJson ?? string.Empty,
                    s.AverageRating,
                    s.ReviewCount,
                    s.EndorsementCount,
                    s.Location,
                    s.IsRemoteAvailable,
                    s.EstimatedDurationMinutes,
                    s.CreatedAt,
                    s.LastViewedAt));
            }

            return Success(skills, request.PageNumber, request.PageSize, totalRecords);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error searching skills with query: {Query}", request.Query);
            return Error("An error occurred while searching skills");
        }
    }
}
