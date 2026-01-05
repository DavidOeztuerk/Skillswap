using CQRS.Handlers;
using CQRS.Models;
using Contracts.Skill.Responses;
using Microsoft.Extensions.Logging;
using SkillService.Application.Queries;
using SkillService.Domain.Repositories;

namespace SkillService.Application.QueryHandlers;

/// <summary>
/// Handler for getting skill counts for a user (public endpoint)
/// </summary>
public class GetUserSkillCountsQueryHandler(
    ISkillRepository skillRepository,
    ILogger<GetUserSkillCountsQueryHandler> logger)
    : BaseQueryHandler<GetUserSkillCountsQuery, UserSkillCountsResponse>(logger)
{
    private readonly ISkillRepository _skillRepository = skillRepository;

    public override async Task<ApiResponse<UserSkillCountsResponse>> Handle(
        GetUserSkillCountsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting skill counts for user {UserId}", request.UserId);

        var stats = await _skillRepository.GetStatisticsAsync(
            fromDate: null,
            toDate: null,
            categoryId: null,
            userId: request.UserId,
            cancellationToken);

        var response = new UserSkillCountsResponse(
            UserId: request.UserId,
            OfferedCount: stats.OfferedSkills,
            RequestedCount: stats.RequestedSkills,
            TotalCount: stats.TotalSkills
        );

        return Success(response);
    }
}
