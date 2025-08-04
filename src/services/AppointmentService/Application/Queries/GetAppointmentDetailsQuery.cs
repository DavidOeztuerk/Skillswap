using CQRS.Interfaces;

namespace AppointmentService.Application.Queries;

public record GetAppointmentDetailsQuery(
    string AppointmentId) : IQuery<AppointmentDetailsResponse>, ICacheableQuery
{
    public string CacheKey => $"appointment-details:{AppointmentId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record AppointmentDetailsResponse(
    string AppointmentId,
    string Title,
    string? Description,
    DateTime ScheduledDate,
    int DurationMinutes,
    string OrganizerUserId,
    string OrganizerName,
    string ParticipantUserId,
    string ParticipantName,
    string Status,
    string? SkillId,
    string? MatchId,
    string MeetingType,
    string? MeetingLink,
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    DateTime? CompletedAt,
    DateTime? CancelledAt);

