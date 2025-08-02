using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;
using SkillService.Application.Queries;

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

            if (!request.IncludeInactive)
            {
                query = query.Where(c => c.IsActive);
            }

            query = query.OrderBy(c => c.SortOrder).ThenBy(c => c.Name);

            var categories = await query
                .Select(c => new SkillCategoryResponse(
                    c.Id,
                    c.Name,
                    c.IconName,
                    c.Color))
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
