using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Domain event published when a SessionAppointment is marked as no-show
/// </summary>
public record SessionNoShowEvent(
    string SessionAppointmentId,
    string NoShowUserIds,
    string ReportedByUserId) : DomainEvent;
