using CQRS.Interfaces;
using Contracts.Appointment.Responses;

namespace AppointmentService.Application.Queries;

public record GetUserReviewStatsQuery(string UserId)
    : IQuery<UserReviewStatsResponse>, ICacheableQuery
{
    public string CacheKey => $"user-review-stats:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
}
