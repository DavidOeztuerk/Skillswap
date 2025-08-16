using CQRS.Interfaces;

namespace AppointmentService.Application.Queries;

public record GetUserAppointmentsQuery(
    string UserId,
    string? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    bool IncludePast = true,
    int PageNumber = 1,
    int PageSize = 12)
    : IPagedQuery<UserAppointmentResponse>, ICacheableQuery
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;

    public string CacheKey => $"user-appointments:{UserId}:{Status}:{FromDate:yyyy-MM-dd}:{ToDate:yyyy-MM-dd}:{IncludePast}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}

public record UserAppointmentResponse(
    string AppointmentId,
    string Title,
    DateTime ScheduledDate,
    int DurationMinutes,
    string Status,
    string OtherPartyUserId,
    string OtherPartyName,
    string MeetingType,
    bool IsOrganizer);
