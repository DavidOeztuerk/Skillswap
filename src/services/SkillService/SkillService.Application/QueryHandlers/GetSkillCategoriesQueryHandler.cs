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
        {
            var allCategories = await _unitOfWork.SkillCategories.GetAllAsync(cancellationToken);

            var categories = allCategories
                .OrderBy(c => c.Name)
                .Select(c => new SkillCategoryResponse(
                    c.Id,
                    c.Name,
                    c.IconName,
                    c.Color,
                    0)) // Count wird in Infrastructure mit Join berechnet
                .ToList();

            return Success(categories);
        }
    }
}
