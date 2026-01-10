using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.QueryHandlers;

public class GetSkillCategoriesQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<GetSkillCategoriesQueryHandler> logger)
    : BaseQueryHandler<
    GetSkillCategoriesQuery,
    List<SkillCategoryResponse>>(
        logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<List<SkillCategoryResponse>>> Handle(
        GetSkillCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        // Load full hierarchy: Category -> Subcategory -> Topic
        var allCategories = await _unitOfWork.SkillCategories.GetAllWithHierarchyAsync(cancellationToken);

        var categories = allCategories
            .Select(c => new SkillCategoryResponse(
                c.Id,
                c.Name,
                c.IconName,
                c.Color,
                c.Subcategories.Sum(s => s.Topics.Sum(t => t.Skills.Count)),
                c.Subcategories
                    .OrderBy(s => s.DisplayOrder)
                    .ThenBy(s => s.Name)
                    .Select(s => new SkillSubcategoryResponse(
                        s.Id,
                        s.Name,
                        s.IconName,
                        s.Topics
                            .OrderBy(t => t.DisplayOrder)
                            .ThenBy(t => t.Name)
                            .Select(t => new SkillTopicResponse(
                                t.Id,
                                t.Name,
                                t.IsFeatured,
                                t.Skills.Count))
                            .ToList()))
                    .ToList()))
            .ToList();

        return Success(categories);
    }
}
