using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record MatchRequestCreatedDomainEvent(
    string RequestId,
    string RequesterId,
    string TargetUserId,
    string SkillId,
    string Message,
    bool IsSkillExchange,
    string? ExchangeSkillId = null,
    bool IsMonetary = false,
    decimal? OfferedAmount = null,
    string? Currency = null,
    int? SessionDurationMinutes = null,
    int? TotalSessions = null) : DomainEvent;
