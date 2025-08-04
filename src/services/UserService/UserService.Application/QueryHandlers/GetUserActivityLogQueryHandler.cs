using System.Text.Json;
using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Domain.Repositories;
using UserService.Api.Application.Queries;
using Microsoft.Extensions.Logging;
using CQRS.Models;

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
        try
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
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving activity log for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving user activity log");
        }
    }
}