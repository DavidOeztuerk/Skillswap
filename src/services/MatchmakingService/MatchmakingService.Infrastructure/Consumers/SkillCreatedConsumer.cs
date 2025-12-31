using Events.Integration.SkillManagement;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Consumer;

/// <summary>
/// Consumes SkillCreatedEvent to log skill creation for potential matching.
///
/// NOTE: Full automatic matching (as described in the plan) requires:
/// 1. Query SkillService for compatible skills (opposite isOffered, same category)
/// 2. Check location compatibility using geocoded coordinates
/// 3. Calculate schedule overlap
/// 4. Create MatchRequests only for high-scoring matches (>0.6)
///
/// For MVP, this consumer logs the event and can be extended to implement
/// automatic matching in a future iteration.
/// </summary>
public class SkillCreatedConsumer(
    ILogger<SkillCreatedConsumer> logger)
    : IConsumer<SkillCreatedEvent>
{
    private readonly ILogger<SkillCreatedConsumer> _logger = logger;

    public Task Consume(ConsumeContext<SkillCreatedEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "Received SkillCreatedEvent: SkillId={SkillId}, Name={Name}, " +
            "Category={Category}, IsOffered={IsOffered}, ExchangeType={ExchangeType}, " +
            "LocationType={LocationType}, City={City}",
            message.SkillId,
            message.Name,
            message.CategoryName,
            message.IsOffered,
            message.ExchangeType,
            message.LocationType,
            message.LocationCity);

        // Log matching-relevant data
        _logger.LogDebug(
            "Skill matching data: PreferredDays=[{Days}], PreferredTimes=[{Times}], " +
            "SessionDuration={Duration}min, TotalSessions={Sessions}, " +
            "Coordinates=({Lat},{Lng}), MaxDistance={MaxKm}km",
            string.Join(",", message.PreferredDays),
            string.Join(",", message.PreferredTimes),
            message.SessionDurationMinutes,
            message.TotalSessions,
            message.LocationLatitude,
            message.LocationLongitude,
            message.MaxDistanceKm);

        // TODO: Implement automatic matching in future iteration
        // 1. Call SkillService to find compatible skills:
        //    - Same CategoryId
        //    - Opposite IsOffered (Anbieter <-> Suchende)
        //    - Compatible ExchangeType
        // 2. Filter by location compatibility (using LocationLatitude/Longitude)
        // 3. Calculate compatibility score using CompatibilityCalculator
        // 4. Create automatic MatchRequest for scores > 0.6

        return Task.CompletedTask;
    }
}
