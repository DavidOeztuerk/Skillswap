using Contracts.User.Responses.Auth;
using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Queries;

// ============================================================================
// GET USER STATISTICS QUERY (Admin only)
// ============================================================================

public record GetUserStatisticsQuery(
    DateTime? FromDate = null,
    DateTime? ToDate = null)
    : IQuery<UserStatisticsResponse>, ICacheableQuery
{
    public string CacheKey => $"user-stats:{FromDate:yyyy-MM-dd}:{ToDate:yyyy-MM-dd}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(30);
}

public record UserStatisticsResponse(
    int TotalUsers,
    int ActiveUsers,
    int VerifiedUsers,
    int NewUsersToday,
    int NewUsersThisWeek,
    int NewUsersThisMonth,
    Dictionary<string, int> UsersByRole,
    Dictionary<AccountStatus, int> UsersByAccountStatus,
    List<DailyUserRegistration> RegistrationTrend);

public record DailyUserRegistration(
    DateTime Date,
    int Count);

public class GetUserStatisticsQueryValidator : AbstractValidator<GetUserStatisticsQuery>
{
    public GetUserStatisticsQueryValidator()
    {
        RuleFor(x => x)
            .Must(x => x.FromDate == null || x.ToDate == null || x.FromDate <= x.ToDate)
            .WithMessage("FromDate must be before or equal to ToDate");
    }
}
