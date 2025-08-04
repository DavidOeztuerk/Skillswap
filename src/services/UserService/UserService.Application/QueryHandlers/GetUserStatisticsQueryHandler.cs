using Microsoft.EntityFrameworkCore;
using UserService.Application.Queries;
using CQRS.Handlers;
using CQRS.Models;
using UserService.Domain.Enums;
using UserService.Api.Application.Queries;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace UserService.Api.Application.QueryHandlers;

public class GetUserStatisticsQueryHandler(
    IUserRepository userRepository,
    ILogger<GetUserStatisticsQueryHandler> logger)
    : BaseQueryHandler<GetUserStatisticsQuery, UserStatisticsResponse>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;

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

            // Get users count by status and role using repository methods
            var usersByAccountStatus = await _userRepository.GetUsersCountByStatus(cancellationToken);
            var usersByRole = await _userRepository.GetUsersCountByRole(cancellationToken);

            // Calculate basic counts from status dictionary
            var totalUsers = usersByAccountStatus.Values.Sum();
            var activeUsers = usersByAccountStatus.GetValueOrDefault(AccountStatus.Active.ToString(), 0);

            // For more complex queries, we need to use the GetUsers queryable
            var usersQuery = _userRepository.GetUsers(cancellationToken).Where(u => !u.IsDeleted);

            var verifiedUsers = await usersQuery.CountAsync(u => u.EmailVerified, cancellationToken);
            var newUsersToday = await usersQuery.CountAsync(u => u.CreatedAt >= today, cancellationToken);
            var newUsersThisWeek = await usersQuery.CountAsync(u => u.CreatedAt >= weekStart, cancellationToken);
            var newUsersThisMonth = await usersQuery.CountAsync(u => u.CreatedAt >= monthStart, cancellationToken);

            // Registration trend (last 30 days)
            var trendStartDate = request.FromDate ?? today.AddDays(-30);
            var trendEndDate = request.ToDate ?? today;

            var registrationTrend = await usersQuery
                .Where(u => u.CreatedAt >= trendStartDate && u.CreatedAt <= trendEndDate)
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
