using CQRS.Interfaces;

namespace Events.Domain.Appointment;

public record AppointmentAcceptedDomainEvent(
    string AppointmentId,
    string AcceptedByUserId,
    string OtherParticipantId,
    DateTime ScheduledDate,
    int DurationMinutes,
    string? SkillId,
    bool BothPartiesAccepted) : DomainEvent;