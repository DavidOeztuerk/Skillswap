using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record MatchAcceptedWithScheduleDomainEvent(
    string MatchId,
    string OfferedSkillId,
    string OfferedSkillName,
    string RequestedSkillId,
    string RequestedSkillName,
    string OfferingUserId,
    string RequestingUserId,
    List<string> AgreedDays,
    List<string> AgreedTimes,
    int SessionDurationMinutes,
    int TotalSessions,
    bool IsSkillExchange,
    string? ExchangeSkillId,
    string? ExchangeSkillName,
    bool IsMonetary,
    decimal? AgreedAmount,
    DateTime AcceptedAt) : DomainEvent
{
}
