using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Infrastructure.Repositories;

public class UserActivityRepository(
    UserDbContext userDbContext) : IUserActivityRepository
{
    private readonly UserDbContext _dbContext = userDbContext;

    public async Task<(List<UserActivity> activities, int totalCount)> GetUserActivities(
        string userId, 
        DateTime? fromDate, 
        DateTime? toDate, 
        string? activityType, 
        int pageNumber, 
        int pageSize, 
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.UserActivities
            .Where(ua => ua.UserId == userId && !ua.IsDeleted);

        // Apply date filters
        if (fromDate.HasValue)
        {
            query = query.Where(ua => ua.Timestamp >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(ua => ua.Timestamp <= toDate.Value);
        }

        // Apply activity type filter
        if (!string.IsNullOrEmpty(activityType))
        {
            query = query.Where(ua => ua.ActivityType == activityType);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var activities = await query
            .OrderByDescending(ua => ua.Timestamp)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return (activities, totalCount);
    }

    public async Task<UserActivity> AddUserActivity(UserActivity activity, CancellationToken cancellationToken = default)
    {
        if (activity == null)
        {
            throw new BusinessRuleViolationException("ACTIVITY_NULL", "ActivityRequired", "Activity cannot be null");
        }

        // Validate required fields
        if (string.IsNullOrEmpty(activity.UserId))
        {
            throw new BusinessRuleViolationException("USERID_REQUIRED", "UserIdRequired", "UserId is required");
        }

        if (string.IsNullOrEmpty(activity.ActivityType))
        {
            throw new BusinessRuleViolationException("ACTIVITY_TYPE_REQUIRED", "ActivityTypeRequired", "ActivityType is required");
        }

        if (string.IsNullOrEmpty(activity.Description))
        {
            throw new BusinessRuleViolationException("DESCRIPTION_REQUIRED", "DescriptionRequired", "Description is required");
        }

        // Set timestamp if not provided
        if (activity.Timestamp == default)
        {
            activity.Timestamp = DateTime.UtcNow;
        }

        _dbContext.UserActivities.Add(activity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return activity;
    }
}