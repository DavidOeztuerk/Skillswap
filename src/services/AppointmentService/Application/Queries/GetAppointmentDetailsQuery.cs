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
    DateTimeOffset ScheduledDate,
    int DurationMinutes,
    string OrganizerUserId,
    string OrganizerName,
    string ParticipantUserId,
    string ParticipantName,
    string Status,
    string? SkillId,
    string? SkillName,
    string? MatchId,
    string MeetingType,
    string? MeetingLink,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    DateTimeOffset? AcceptedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? CancelledAt,
    string? CancellationReason);

