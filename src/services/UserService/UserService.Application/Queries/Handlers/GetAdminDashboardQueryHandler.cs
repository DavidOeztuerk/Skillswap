using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;

namespace UserService.Application.Queries.Handlers;

public class GetAdminDashboardQueryHandler(
    IUserRepository context,
    ILogger<GetAdminDashboardQueryHandler> logger)
    : BaseQueryHandler<GetAdminDashboardQuery, AdminDashboardResponse>(logger)
{
    private readonly IUserRepository _context = context;

    public override async Task<ApiResponse<AdminDashboardResponse>> Handle(
        GetAdminDashboardQuery request,
        CancellationToken cancellationToken)
    {
        await Task.CompletedTask;

        try
        {
            Logger.LogInformation("Getting admin dashboard data");

            var today = DateTime.UtcNow.Date;
            var thirtyDaysAgo = today.AddDays(-30);

            // Get user statistics
            // var totalUsers = await _context.Users.CountAsync(cancellationToken);
            // var activeUsers = await _context.Users
            //     .Where(u => u.LastLoginAt.HasValue && u.LastLoginAt.Value >= thirtyDaysAgo)
            //     .CountAsync(cancellationToken);
            // var newUsersToday = await _context.Users
            //     .Where(u => u.CreatedAt.Date == today)
            //     .CountAsync(cancellationToken);

            // // Get skill statistics
            // var totalSkills = await _context.Users
            //     .SelectMany(u => u.Skills)
            //     .CountAsync(cancellationToken);
            // var newSkillsToday = await _context.Users
            //     .SelectMany(u => u.Skills)
            //     .Where(s => s.CreatedAt.Date == today)
            //     .CountAsync(cancellationToken);

            // Get appointment statistics (mock data for now)
            var totalAppointments = 150; // Mock data
            var completedAppointmentsToday = 5; // Mock data

            // Get match statistics (mock data for now)
            var totalMatches = 200; // Mock data
            var activeMatches = 45; // Mock data

            // Get pending reports (mock data for now)
            var pendingReports = 3; // Mock data

            // Get top categories with growth
            var topCategories = new List<TopCategory>
            {
                new TopCategory("Programming", 125, 0.15),
                new TopCategory("Design", 89, 0.08),
                new TopCategory("Marketing", 67, -0.03),
                new TopCategory("Languages", 54, 0.22),
                new TopCategory("Music", 43, 0.05)
            };

            var response = new AdminDashboardResponse
            {
                Overview = new DashboardOverview
                {
                    // TotalUsers = totalUsers,
                    // ActiveUsers = activeUsers,
                    // TotalSkills = totalSkills,
                    TotalAppointments = totalAppointments,
                    TotalMatches = totalMatches,
                    PendingReports = pendingReports
                },
                RecentActivity = new DashboardActivity
                {
                    // NewUsers = newUsersToday,
                    // NewSkills = newSkillsToday,
                    CompletedAppointments = completedAppointmentsToday,
                    ActiveMatches = activeMatches
                },
                TopCategories = topCategories
            };

            return Success(response, "Dashboard data retrieved successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting admin dashboard data");
            return Error("Failed to retrieve dashboard data");
        }
    }
}
