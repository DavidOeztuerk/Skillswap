using CQRS.Interfaces;

namespace Events.Domain.Appointment;

public record MeetingLinkGeneratedDomainEvent(
    string AppointmentId,
    string MeetingLink,
    string ParticipantOneId,
    string ParticipantOneEmail,
    string ParticipantOneName,
    string ParticipantTwoId,
    string ParticipantTwoEmail,
    string ParticipantTwoName,
    DateTime ScheduledDate,
    int DurationMinutes,
    string? SkillName) : DomainEvent;