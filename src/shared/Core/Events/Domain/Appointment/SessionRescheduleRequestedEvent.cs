using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Domain event published when a reschedule is requested for a SessionAppointment
/// </summary>
public record SessionRescheduleRequestedEvent(
    string SessionAppointmentId,
    string RequestedByUserId,
    DateTime ProposedDate,
    int? ProposedDuration,
    string Reason) : DomainEvent;
