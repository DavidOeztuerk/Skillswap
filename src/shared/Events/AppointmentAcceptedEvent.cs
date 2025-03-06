namespace Events;

public record AppointmentAcceptedEvent(
    string AppointmentId,
    string CreatorId,
    string ParticipantId);
