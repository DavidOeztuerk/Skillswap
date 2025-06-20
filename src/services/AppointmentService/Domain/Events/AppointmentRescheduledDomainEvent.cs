using CQRS.Interfaces;

namespace AppointmentService.Domain.Events;

public record AppointmentRescheduledDomainEvent(
    string AppointmentId,
    DateTime OldDate,
    DateTime NewDate,
    string RescheduledByUserId) : DomainEvent;
