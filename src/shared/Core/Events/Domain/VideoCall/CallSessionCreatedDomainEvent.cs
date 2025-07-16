using CQRS.Interfaces;

namespace Events.Domain.VideoCall;

public record CallSessionCreatedDomainEvent(
    string SessionId,
    string RoomId,
    string InitiatorUserId,
    string ParticipantUserId,
    string? AppointmentId) : DomainEvent;
