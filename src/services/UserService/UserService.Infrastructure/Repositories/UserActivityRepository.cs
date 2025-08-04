using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

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
        try
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
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get user activities for user {userId}", ex);
        }
    }

    public async Task<UserActivity> AddUserActivity(UserActivity activity, CancellationToken cancellationToken = default)
    {
        try
        {
            if (activity == null)
            {
                throw new ArgumentNullException(nameof(activity));
            }

            // Validate required fields
            if (string.IsNullOrEmpty(activity.UserId))
            {
                throw new ArgumentException("UserId is required", nameof(activity));
            }

            if (string.IsNullOrEmpty(activity.ActivityType))
            {
                throw new ArgumentException("ActivityType is required", nameof(activity));
            }

            if (string.IsNullOrEmpty(activity.Description))
            {
                throw new ArgumentException("Description is required", nameof(activity));
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
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to add user activity for user {activity?.UserId}", ex);
        }
    }
}