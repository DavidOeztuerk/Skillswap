using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillTrendingDomainEvent(
    string SkillId,
    string SkillName,
    string CategoryId,
    int RecentViews,
    double GrowthRate,
    string TrendPeriod) : DomainEvent; // "daily", "weekly", "monthly"
