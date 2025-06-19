using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillTrendingDomainEvent(
    string SkillId,
    string SkillName,
    string CategoryId,
    int RecentViews,
    double GrowthRate,
    string TrendPeriod) : DomainEvent; // "daily", "weekly", "monthly"
