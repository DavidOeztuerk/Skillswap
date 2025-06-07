using Microsoft.EntityFrameworkCore;
using UserService.Application.Queries;
using CQRS.Handlers;
using Infrastructure.Models;

namespace UserService.Application.QueryHandlers;

// ============================================================================
// GET USER STATISTICS QUERY HANDLER
// ============================================================================

public class GetUserStatisticsQueryHandler(
    UserDbContext dbContext,
    ILogger<GetUserStatisticsQueryHandler> logger) 
    : BaseQueryHandler<GetUserStatisticsQuery, UserStatisticsResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<UserStatisticsResponse>> Handle(
        GetUserStatisticsQuery request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var now = DateTime.UtcNow;
            var today = now.Date;
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var monthStart = new DateTime(today.Year, today.Month, 1);

            // Basic counts
            var totalUsers = await _dbContext.Users.CountAsync(u => !u.IsDeleted, cancellationToken);
            var activeUsers = await _dbContext.Users.CountAsync(u => u.AccountStatus == "Active" && !u.IsDeleted, cancellationToken);
            var verifiedUsers = await _dbContext.Users.CountAsync(u => u.EmailVerified && !u.IsDeleted, cancellationToken);

            // New users
            var newUsersToday = await _dbContext.Users.CountAsync(u => u.CreatedAt >= today && !u.IsDeleted, cancellationToken);
            var newUsersThisWeek = await _dbContext.Users.CountAsync(u => u.CreatedAt >= weekStart && !u.IsDeleted, cancellationToken);
            var newUsersThisMonth = await _dbContext.Users.CountAsync(u => u.CreatedAt >= monthStart && !u.IsDeleted, cancellationToken);

            // Users by role
            var usersByRole = await _dbContext.Users
                .Include(u => u.UserRoles.Where(ur => ur.IsActive))
                .Where(u => !u.IsDeleted)
                .SelectMany(u => u.UserRoles.Where(ur => ur.IsActive).Select(ur => ur.Role))
                .GroupBy(role => role)
                .ToDictionaryAsync(g => g.Key, g => g.Count(), cancellationToken);

            // Users by account status
            var usersByAccountStatus = await _dbContext.Users
                .Where(u => !u.IsDeleted)
                .GroupBy(u => u.AccountStatus)
                .ToDictionaryAsync(g => g.Key, g => g.Count(), cancellationToken);

            // Registration trend (last 30 days)
            var trendStartDate = request.FromDate ?? today.AddDays(-30);
            var trendEndDate = request.ToDate ?? today;

            var registrationTrend = await _dbContext.Users
                .Where(u => u.CreatedAt >= trendStartDate && u.CreatedAt <= trendEndDate && !u.IsDeleted)
                .GroupBy(u => u.CreatedAt.Date)
                .Select(g => new DailyUserRegistration(g.Key, g.Count()))
                .OrderBy(x => x.Date)
                .ToListAsync(cancellationToken);

            var response = new UserStatisticsResponse(
                totalUsers,
                activeUsers,
                verifiedUsers,
                newUsersToday,
                newUsersThisWeek,
                newUsersThisMonth,
                usersByRole,
                usersByAccountStatus,
                registrationTrend);

            Logger.LogInformation("Retrieved user statistics");
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving user statistics");
            return Error("An error occurred while retrieving user statistics");
        }
    }
}
