using CQRS.Interfaces;

namespace VideocallService.Domain.Events;

public record CallSessionCreatedDomainEvent(
    string SessionId,
    string RoomId,
    string InitiatorUserId,
    string ParticipantUserId,
    string? AppointmentId) : DomainEvent;
