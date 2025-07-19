using Microsoft.EntityFrameworkCore;
using UserService.Application.Queries;
using System.Text.Json;
using CQRS.Handlers;
using Infrastructure.Models;

namespace UserService.Application.QueryHandlers;

// ============================================================================
// GET USER ACTIVITY LOG QUERY HANDLER
// ============================================================================

public class GetUserActivityLogQueryHandler(
    UserDbContext dbContext,
    ILogger<GetUserActivityLogQueryHandler> logger) 
    : BasePagedQueryHandler<GetUserActivityLogQuery, UserActivityResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<PagedResponse<UserActivityResponse>> Handle(
        GetUserActivityLogQuery request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.UserActivities
                .Where(a => a.UserId == request.UserId && !a.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (request.FromDate.HasValue)
            {
                query = query.Where(a => a.Timestamp >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                query = query.Where(a => a.Timestamp <= request.ToDate.Value);
            }

            if (!string.IsNullOrEmpty(request.ActivityType))
            {
                query = query.Where(a => a.ActivityType == request.ActivityType);
            }

            // Get total count
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply paging and get results
            var activities = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(a => new UserActivityResponse(
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
                .ToListAsync(cancellationToken);

            Logger.LogInformation("Retrieved activity log for user {UserId}, found {Count} activities", 
                request.UserId, totalCount);

            return Success(activities, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving activity log for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving user activity log");
        }
    }
}