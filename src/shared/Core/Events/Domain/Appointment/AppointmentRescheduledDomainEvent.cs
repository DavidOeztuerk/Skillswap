using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Event raised when an appointment is rescheduled
/// </summary>
public record AppointmentRescheduledDomainEvent(
    string AppointmentId,
    string RescheduledByUserId,
    string OtherParticipantId,
    DateTime OldScheduledDate,
    DateTime NewScheduledDate,
    int OldDurationMinutes,
    int NewDurationMinutes,
    string? Reason,
    string? SkillName) : DomainEvent;