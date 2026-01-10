using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.QueryHandlers;

public class GetSkillStatisticsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<GetSkillStatisticsQueryHandler> logger)
    : BaseQueryHandler<
    GetSkillStatisticsQuery,
    SkillStatisticsResponse>(
        logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<SkillStatisticsResponse>> Handle(
        GetSkillStatisticsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting skill statistics with filters: FromDate={FromDate}, ToDate={ToDate}, CategoryId={CategoryId}, UserId={UserId}",
            request.FromDate, request.ToDate, request.CategoryId, request.UserId);

        var (totalSkills, offeredSkills, requestedSkills, activeSkills, averageRating,
             skillsByCategory, topRatedSkills, trendingSkills, popularTags) =
            await _unitOfWork.Skills.GetStatisticsAsync(
                request.FromDate,
                request.ToDate,
                request.CategoryId,
                request.UserId,
                cancellationToken);

        // SkillsByProficiencyLevel not returned by repository, use empty dictionary
        var skillsByProficiencyLevel = new Dictionary<string, int>();
        var topRated = topRatedSkills.Select(s => new TopSkillResponse(s.Id, s.Name, s.Rating, s.ReviewCount)).ToList();
        var trending = trendingSkills.Select(s => new TrendingSkillResponse(s.Id, s.Name, s.CategoryName, s.ViewCount, s.ViewCount > 0 ? 25 : 0)).ToList();

        var response = new SkillStatisticsResponse(
            totalSkills,
            offeredSkills,
            requestedSkills,
            activeSkills,
            averageRating,
            skillsByCategory,
            skillsByProficiencyLevel,
            topRated,
            trending,
            popularTags);

        Logger.LogInformation("Retrieved statistics: {TotalSkills} total skills, {AverageRating} average rating",
            totalSkills, averageRating);

        return Success(response);
    }
}
