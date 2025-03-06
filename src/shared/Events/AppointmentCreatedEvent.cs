namespace Events;

public record AppointmentCreatedEvent(
    string Id,
    string Title,
    string Description,
    DateTime Date,
    string CreatedBy,
    string ParticipantId);
