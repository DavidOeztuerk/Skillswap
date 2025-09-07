using System.Text.Json;
using CQRS.Handlers;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using UserService.Application.Queries;
using Contracts.User.Responses;

namespace UserService.Application.QueryHandlers;

public class GetUserActivityLogQueryHandler(
    IUserActivityRepository userActivityRepository,
    ILogger<GetUserActivityLogQueryHandler> logger)
    : BasePagedQueryHandler<GetUserActivityLogQuery, UserActivityResponse>(logger)
{
    private readonly IUserActivityRepository _userActivityRepository = userActivityRepository;

    public override async Task<PagedResponse<UserActivityResponse>> Handle(
        GetUserActivityLogQuery request,
        CancellationToken cancellationToken)
    {
        // Use repository method to get user activities with pagination
        var (activities, totalCount) = await _userActivityRepository.GetUserActivities(
            request.UserId,
            request.FromDate,
            request.ToDate,
            request.ActivityType,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        // Map to response objects
        var activityResponses = activities.Select(a => new UserActivityResponse(
            a.Id,
            a.UserId,
            a.ActivityType,
            a.Description,
            a.IpAddress,
            a.UserAgent,
            a.Timestamp,
            string.IsNullOrEmpty(a.MetadataJson)
                ? new Dictionary<string, object>()
                : JsonSerializer.Deserialize<Dictionary<string, object>>(a.MetadataJson, new JsonSerializerOptions())
                  ?? new Dictionary<string, object>()))
        .ToList();

        Logger.LogInformation("Retrieved activity log for user {UserId}, found {Count} activities",
            request.UserId, totalCount);

        return Success(activityResponses, request.PageNumber, request.PageSize, totalCount);
    }
}