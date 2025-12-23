using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Domain event published when a new Connection is created
/// </summary>
public record ConnectionCreatedEvent(
    string ConnectionId,
    string RequesterId,
    string TargetUserId,
    string ConnectionType,
    string SkillId,
    int TotalSessionsPlanned) : DomainEvent;
