using CQRS.Interfaces;

namespace AppointmentService.Domain.Events;

public record AppointmentCancelledDomainEvent(
    string AppointmentId,
    string CancelledByUserId,
    string? Reason,
    DateTime CancelledAt) : DomainEvent;
