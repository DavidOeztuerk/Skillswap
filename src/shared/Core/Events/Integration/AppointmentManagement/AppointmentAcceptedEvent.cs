namespace Events.Integration.AppointmentManagement;

public record AppointmentAcceptedEvent(
    string AppointmentId,
    string CreatorId,
    string ParticipantId);
