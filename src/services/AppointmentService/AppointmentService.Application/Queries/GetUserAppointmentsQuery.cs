using CQRS.Interfaces;
using Contracts.Appointment.Responses;

namespace AppointmentService.Application.Queries;

public record GetUserAppointmentsQuery(
    string UserId,
    string? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    bool IncludePast = true,
    int PageNumber = 1,
    int PageSize = 12)
    : IPagedQuery<UserAppointmentItem>, ICacheableQuery
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;

    public string CacheKey => $"user-appointments:{UserId}:{Status}:{FromDate:yyyy-MM-dd}:{ToDate:yyyy-MM-dd}:{IncludePast}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}
