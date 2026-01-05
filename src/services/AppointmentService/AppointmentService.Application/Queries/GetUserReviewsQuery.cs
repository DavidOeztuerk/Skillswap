using CQRS.Interfaces;
using Contracts.Appointment.Responses;

namespace AppointmentService.Application.Queries;

public record GetUserReviewsQuery(
    string UserId,
    int? StarFilter = null,
    int PageNumber = 1,
    int PageSize = 10)
    : IPagedQuery<UserReviewResponse>, ICacheableQuery
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;

    public string CacheKey => $"user-reviews:{UserId}:{StarFilter}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}
