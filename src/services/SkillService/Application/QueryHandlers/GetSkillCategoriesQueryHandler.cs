using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;

namespace SkillService.Application.QueryHandlers;

public class GetSkillCategoriesQueryHandler(
    SkillDbContext dbContext,
    ILogger<GetSkillCategoriesQueryHandler> logger)
    : BaseQueryHandler<
    GetSkillCategoriesQuery,
    List<SkillCategoryResponse>>(
        logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<List<SkillCategoryResponse>>> Handle(
        GetSkillCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.SkillCategories.AsQueryable();

            query = query.OrderBy(c => c.Name);

            var categories = await query
                .Select(c => new SkillCategoryResponse(
                    c.Id,
                    c.Name,
                    c.IconName,
                    c.Color,
                    c.Skills.Count))
                .ToListAsync(cancellationToken);

            return Success(categories);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting skill categories");
            return Error("An error occurred while retrieving skill categories");
        }
    }
}
