using Contracts.Skill.Requests;
using SkillService.Application.Commands;
using SkillService.Application.Queries;

namespace SkillService.Application.Mappers;

/// <summary>
/// Contract mapper interface for SkillService
/// Maps between API contracts (requests/responses) and internal CQRS commands/queries
/// </summary>
public interface ISkillContractMapper
{
    // Command mappings
    CreateSkillCommand MapToCommand(CreateSkillRequest request, string userId);
    UpdateSkillCommand MapToCommand(UpdateSkillRequest request, string skillId, string userId);
    DeleteSkillCommand MapToCommand(DeleteSkillRequest request, string skillId, string userId);
    RateSkillCommand MapToCommand(RateSkillRequest request, string skillId, string userId);
    EndorseSkillCommand MapToCommand(EndorseSkillRequest request, string skillId, string userId);
    CreateSkillCategoryCommand MapToCommand(CreateSkillCategoryRequest request, string userId);
    UpdateSkillCategoryCommand MapToCommand(UpdateSkillCategoryRequest request, string categoryId, string userId);
    CreateProficiencyLevelCommand MapToCommand(CreateProficiencyLevelRequest request, string userId);

    // Query mappings
    SearchSkillsQuery MapToQuery(SearchSkillsRequest request, string? userId = null);
    GetSkillDetailsQuery MapToQuery(GetSkillDetailsRequest request);
    GetUserSkillsQuery MapToQuery(GetUserSkillsRequest request, string userId);
    GetSkillCategoriesQuery MapToQuery(GetSkillCategoriesRequest request);
    GetProficiencyLevelsQuery MapToQuery(GetProficiencyLevelsRequest request);
    GetSkillStatisticsQuery MapToQuery(GetSkillStatisticsRequest request);
    GetPopularTagsQuery MapToQuery(GetPopularTagsRequest request);
    GetSkillRecommendationsQuery MapToQuery(GetSkillRecommendationsRequest request, string userId);
}