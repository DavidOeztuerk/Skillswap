using Contracts.Skill.Requests;
using Contracts.Skill.Responses;
using SkillService.Application.Commands;
using SkillService.Application.Queries;

namespace SkillService.Application.Mappers;

/// <summary>
/// Maps between Skill API contracts and CQRS commands/queries
/// </summary>
public class SkillContractMapper : ISkillContractMapper
{
    public CreateSkillCommand MapToCommand(CreateSkillRequest request, string? userId = null)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        return new CreateSkillCommand(
            request.Name,
            request.Description,
            request.CategoryId,
            request.ProficiencyLevelId,
            request.Tags ?? new List<string>(),
            request.IsOffered,
            request.IsWanted,
            request.AvailableHours,
            request.PreferredSessionDuration,
            request.Location,
            request.IsRemote)
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        };
    }

    public CreateSkillResponse MapToResponse(CreateSkillCommandResponse commandResponse)
    {
        ArgumentNullException.ThrowIfNull(commandResponse);

        return new CreateSkillResponse(
            commandResponse.SkillId,
            commandResponse.Name,
            commandResponse.Description,
            commandResponse.CategoryName,
            commandResponse.ProficiencyLevelName,
            commandResponse.Tags,
            commandResponse.IsOffered,
            commandResponse.IsWanted,
            commandResponse.Status,
            commandResponse.CreatedAt);
    }

    public UpdateSkillCommand MapToCommand(UpdateSkillRequest request, string? userId = null)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        return new UpdateSkillCommand(
            request.SkillId,
            request.Name,
            request.Description,
            request.CategoryId,
            request.ProficiencyLevelId,
            request.Tags,
            request.IsOffered,
            request.IsWanted,
            request.AvailableHours,
            request.PreferredSessionDuration,
            request.Location,
            request.IsRemote)
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        };
    }

    public UpdateSkillResponse MapToResponse(UpdateSkillCommandResponse commandResponse)
    {
        ArgumentNullException.ThrowIfNull(commandResponse);

        return new UpdateSkillResponse(
            commandResponse.SkillId,
            commandResponse.Name,
            commandResponse.Description,
            commandResponse.CategoryName,
            commandResponse.ProficiencyLevelName,
            commandResponse.Tags,
            commandResponse.IsOffered,
            commandResponse.IsWanted,
            commandResponse.Status,
            commandResponse.UpdatedAt);
    }

    public SearchSkillsQuery MapToQuery(SearchSkillsRequest request, string? userId = null)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new SearchSkillsQuery(
            UserId: userId,
            Query: request.SearchTerm,
            CategoryId: request.CategoryId,
            ProficiencyLevelId: request.ProficiencyLevelId,
            IsOffering: request.IsOffered,
            TagsJson: request.Tags != null ? string.Join(",", request.Tags) : null,
            Location: request.Location,
            MaxDistance: null, // Not in request
            RemoteOnly: request.IsRemote,
            MinRating: request.MinRating.HasValue ? (int)request.MinRating.Value : null,
            SortBy: request.SortBy,
            SortDirection: request.SortDescending ? "desc" : "asc",
            PageNumber: request.PageNumber,
            PageSize: request.PageSize);
    }

    public SearchSkillsResponse MapToResponse(SearchSkillsQueryResponse queryResponse)
    {
        ArgumentNullException.ThrowIfNull(queryResponse);

        var skills = queryResponse.Skills.Select(s => new SkillSummaryResponse(
            s.SkillId,
            s.Name,
            s.Description,
            s.CategoryName,
            s.ProficiencyLevelName,
            s.Tags,
            s.OwnerName,
            s.IsOffered,
            s.IsWanted,
            s.Rating,
            s.ReviewCount,
            s.Location,
            s.IsRemote,
            s.CreatedAt)).ToList();

        return new SearchSkillsResponse(
            skills,
            queryResponse.PageNumber,
            queryResponse.PageSize,
            queryResponse.TotalCount,
            queryResponse.TotalPages,
            queryResponse.HasNextPage,
            queryResponse.HasPreviousPage);
    }

    public GetSkillDetailsQuery MapToQuery(GetSkillDetailsRequest request, string? userId = null)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new GetSkillDetailsQuery(request.SkillId);
    }

    public SkillDetailsResponse MapToResponse(GetSkillDetailsQueryResponse queryResponse)
    {
        ArgumentNullException.ThrowIfNull(queryResponse);

        return new SkillDetailsResponse(
            queryResponse.SkillId,
            queryResponse.Name,
            queryResponse.Description,
            new SkillCategoryInfo(
                queryResponse.Category.Id,
                queryResponse.Category.Name,
                queryResponse.Category.Description),
            new ProficiencyLevelInfo(
                queryResponse.ProficiencyLevel.Id,
                queryResponse.ProficiencyLevel.Name,
                queryResponse.ProficiencyLevel.Description,
                queryResponse.ProficiencyLevel.Level),
            queryResponse.Tags,
            new SkillOwnerInfo(
                queryResponse.Owner.UserId,
                queryResponse.Owner.FirstName,
                queryResponse.Owner.LastName,
                queryResponse.Owner.UserName,
                queryResponse.Owner.Rating),
            queryResponse.IsOffered,
            queryResponse.IsWanted,
            queryResponse.Rating,
            queryResponse.ReviewCount,
            queryResponse.EndorsementCount,
            queryResponse.AvailableHours,
            queryResponse.PreferredSessionDuration,
            queryResponse.Location,
            queryResponse.IsRemote,
            queryResponse.Status,
            queryResponse.CreatedAt,
            queryResponse.UpdatedAt);
    }

    public DeleteSkillCommand MapToCommand(DeleteSkillRequest request, string? userId = null)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        return new DeleteSkillCommand(request.SkillId)
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        };
    }

    public DeleteSkillResponse MapToResponse(DeleteSkillCommandResponse commandResponse)
    {
        ArgumentNullException.ThrowIfNull(commandResponse);

        return new DeleteSkillResponse(
            commandResponse.SkillId,
            commandResponse.Success,
            commandResponse.Message ?? "Skill deleted successfully");
    }

    // ============================================================================
    // SKILL CATEGORY MAPPINGS
    // ============================================================================

    public CreateSkillCategoryCommand MapToCommand(CreateSkillCategoryRequest request, string userId)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        return new CreateSkillCategoryCommand(
            request.Name,
            request.Description,
            request.IconName,
            request.Color,
            request.SortOrder,
            request.IsActive)
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        };
    }

    public UpdateSkillCategoryCommand MapToCommand(UpdateSkillCategoryRequest request, string categoryId, string userId)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(categoryId, nameof(categoryId));
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        return new UpdateSkillCategoryCommand(
            categoryId,
            request.Name,
            request.Description,
            request.IconName,
            request.Color,
            request.SortOrder,
            request.IsActive)
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        };
    }

    public GetSkillCategoriesQuery MapToQuery(GetSkillCategoriesRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new GetSkillCategoriesQuery(
            request.IncludeInactive,
            request.IncludeSkillCounts);
    }

    // ============================================================================
    // PROFICIENCY LEVEL MAPPINGS
    // ============================================================================

    public CreateProficiencyLevelCommand MapToCommand(CreateProficiencyLevelRequest request, string userId)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        return new CreateProficiencyLevelCommand(
            request.Level,
            request.Description,
            request.Rank,
            request.Color,
            request.IsActive)
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        };
    }

    public GetProficiencyLevelsQuery MapToQuery(GetProficiencyLevelsRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new GetProficiencyLevelsQuery(
            request.IncludeInactive,
            request.IncludeSkillCounts);
    }

    // ============================================================================
    // SKILL RATING & ENDORSEMENT MAPPINGS
    // ============================================================================

    public RateSkillCommand MapToCommand(RateSkillRequest request, string skillId, string userId)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(skillId, nameof(skillId));
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        return new RateSkillCommand(
            skillId,
            request.RatedUserId,
            request.Rating,
            request.Comment,
            request.Tags)
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        };
    }

    public EndorseSkillCommand MapToCommand(EndorseSkillRequest request, string skillId, string userId)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(skillId, nameof(skillId));
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        return new EndorseSkillCommand(
            skillId,
            request.EndorsedUserId,
            request.Comment)
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        };
    }

    // ============================================================================
    // USER SKILLS MAPPINGS
    // ============================================================================

    public GetUserSkillsQuery MapToQuery(GetUserSkillsRequest request, string userId)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        return new GetUserSkillsQuery(
            request.IsOffering,
            request.CategoryId,
            request.IncludeInactive,
            request.PageNumber,
            request.PageSize)
        {
            UserId = userId
        };
    }

    // ============================================================================
    // SKILL STATISTICS MAPPINGS
    // ============================================================================

    public GetSkillStatisticsQuery MapToQuery(GetSkillStatisticsRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new GetSkillStatisticsQuery(
            request.FromDate,
            request.ToDate,
            request.CategoryId,
            request.UserId);
    }

    // ============================================================================
    // POPULAR TAGS MAPPINGS
    // ============================================================================

    public GetPopularTagsQuery MapToQuery(GetPopularTagsRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new GetPopularTagsQuery(
            request.CategoryId,
            request.MaxTags,
            request.MinUsageCount);
    }

    // ============================================================================
    // SKILL RECOMMENDATIONS MAPPINGS
    // ============================================================================

    public GetSkillRecommendationsQuery MapToQuery(GetSkillRecommendationsRequest request, string userId)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        return new GetSkillRecommendationsQuery(
            userId,
            request.MaxRecommendations,
            request.OnlyRemote,
            request.PreferredLocation);
    }

    // ============================================================================
    // SKILL VALIDATION MAPPINGS
    // ============================================================================

    public ValidateSkillNameQuery MapToQuery(ValidateSkillNameRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new ValidateSkillNameQuery(
            request.Name,
            request.ExcludeSkillId);
    }

    // ============================================================================
    // SKILL LEARNING PATH MAPPINGS
    // ============================================================================

    public GetSkillLearningPathQuery MapToQuery(GetSkillLearningPathRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new GetSkillLearningPathQuery(
            request.TargetSkillId,
            request.CurrentSkillLevel,
            request.MaxSteps);
    }

    // ============================================================================
    // SKILL REVIEWS MAPPINGS
    // ============================================================================

    public GetSkillReviewsQuery MapToQuery(GetSkillReviewsRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new GetSkillReviewsQuery(
            request.SkillId,
            request.MinRating,
            request.SortBy,
            request.PageNumber,
            request.PageSize);
    }

    // ============================================================================
    // SIMILAR SKILLS MAPPINGS
    // ============================================================================

    public SearchSimilarSkillsQuery MapToQuery(SearchSimilarSkillsRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new SearchSimilarSkillsQuery(
            request.SkillId,
            request.MaxResults,
            request.MinSimilarityScore);
    }

    // ============================================================================
    // SKILL ANALYTICS MAPPINGS
    // ============================================================================

    public GetSkillAnalyticsQuery MapToQuery(GetSkillAnalyticsRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new GetSkillAnalyticsQuery(
            request.SkillId,
            request.FromDate,
            request.ToDate);
    }

    // ============================================================================
    // SKILL EXPORT DATA MAPPINGS
    // ============================================================================

    public GetSkillExportDataQuery MapToQuery(GetSkillExportDataRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new GetSkillExportDataQuery(
            request.UserId,
            request.CategoryId,
            request.FromDate,
            request.ToDate,
            request.IncludeReviews,
            request.ExportFormat);
    }

    // ============================================================================
    // SKILL IMPORT MAPPINGS
    // ============================================================================

    public ImportSkillsCommand MapToCommand(ImportSkillsRequest request, string userId)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        var skillsData = request.Skills.Select(s => new SkillService.Application.Commands.SkillImportData(
            s.Name,
            s.Description,
            s.IsOffering,
            s.CategoryName,
            s.ProficiencyLevelName,
            s.Tags)).ToList();

        return new ImportSkillsCommand(
            skillsData,
            request.OverwriteExisting,
            request.ValidateOnly)
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        };
    }

    // ============================================================================
    // BULK UPDATE SKILLS MAPPINGS
    // ============================================================================

    public BulkUpdateSkillsCommand MapToCommand(BulkUpdateSkillsRequest request, string userId)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));

        var updateData = new SkillService.Application.Commands.BulkSkillUpdateData(
            request.UpdateData.IsActive,
            request.UpdateData.SkillCategoryId,
            request.UpdateData.AddTags,
            request.UpdateData.RemoveTags);

        return new BulkUpdateSkillsCommand(
            request.SkillIds,
            updateData)
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        };
    }
}

/// <summary>
/// Interface for Skill service contract mapping
/// </summary>
public interface ISkillContractMapper
{
    // Commands
    CreateSkillCommand MapToCommand(CreateSkillRequest request, string? userId = null);
    UpdateSkillCommand MapToCommand(UpdateSkillRequest request, string? userId = null);
    DeleteSkillCommand MapToCommand(DeleteSkillRequest request, string? userId = null);
    RateSkillCommand MapToCommand(RateSkillRequest request, string skillId, string userId);
    EndorseSkillCommand MapToCommand(EndorseSkillRequest request, string skillId, string userId);
    CreateSkillCategoryCommand MapToCommand(CreateSkillCategoryRequest request, string userId);
    UpdateSkillCategoryCommand MapToCommand(UpdateSkillCategoryRequest request, string categoryId, string userId);
    CreateProficiencyLevelCommand MapToCommand(CreateProficiencyLevelRequest request, string userId);
    ImportSkillsCommand MapToCommand(ImportSkillsRequest request, string userId);
    BulkUpdateSkillsCommand MapToCommand(BulkUpdateSkillsRequest request, string userId);
    
    // Queries
    SearchSkillsQuery MapToQuery(SearchSkillsRequest request, string? userId = null);
    GetSkillDetailsQuery MapToQuery(GetSkillDetailsRequest request, string? userId = null);
    GetUserSkillsQuery MapToQuery(GetUserSkillsRequest request, string userId);
    GetSkillCategoriesQuery MapToQuery(GetSkillCategoriesRequest request);
    GetProficiencyLevelsQuery MapToQuery(GetProficiencyLevelsRequest request);
    GetSkillStatisticsQuery MapToQuery(GetSkillStatisticsRequest request);
    GetPopularTagsQuery MapToQuery(GetPopularTagsRequest request);
    GetSkillRecommendationsQuery MapToQuery(GetSkillRecommendationsRequest request, string userId);
    ValidateSkillNameQuery MapToQuery(ValidateSkillNameRequest request);
    GetSkillLearningPathQuery MapToQuery(GetSkillLearningPathRequest request);
    GetSkillReviewsQuery MapToQuery(GetSkillReviewsRequest request);
    SearchSimilarSkillsQuery MapToQuery(SearchSimilarSkillsRequest request);
    GetSkillAnalyticsQuery MapToQuery(GetSkillAnalyticsRequest request);
    GetSkillExportDataQuery MapToQuery(GetSkillExportDataRequest request);
    
    // Response mappings
    CreateSkillResponse MapToResponse(CreateSkillCommandResponse commandResponse);
    UpdateSkillResponse MapToResponse(UpdateSkillCommandResponse commandResponse);
    DeleteSkillResponse MapToResponse(DeleteSkillCommandResponse commandResponse);
    SearchSkillsResponse MapToResponse(SearchSkillsQueryResponse queryResponse);
    SkillDetailsResponse MapToResponse(GetSkillDetailsQueryResponse queryResponse);
}