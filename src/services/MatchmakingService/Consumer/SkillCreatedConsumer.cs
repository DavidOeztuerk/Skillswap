using Events.Integration.SkillManagement;
using MassTransit;
using MatchmakingService.Domain.Entities;

namespace MatchmakingService.Consumer;

public class SkillCreatedConsumer(
    MatchmakingDbContext dbContext,
    ILogger<SkillCreatedConsumer> logger)
    : IConsumer<SkillCreatedEvent>
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly ILogger<SkillCreatedConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<SkillCreatedEvent> context)
    {
        try
        {
            // Create a match request for the new skill
            var matchRequest = new MatchRequest
            {
                RequesterId = context.Message.SkillCreatorId,
                SkillId = context.Message.SkillId,
                // SkillName = context.Message.Name,
                Description = context.Message.Description,
                // IsOffering = context.Message.IsOffering,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedBy = "system"
            };

            _dbContext.MatchRequests.Add(matchRequest);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Created match request {RequestId} for skill {SkillName}",
                matchRequest.Id, context.Message.Name);

            // Note: Automatic matching should be triggered by user action (e.g., "Find Matches" button)
            // or by a scheduled background job using CompatibilityCalculator
            // to avoid spamming users with unwanted match requests
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SkillCreatedEvent for skill {SkillId}",
                context.Message.SkillId);
            throw;
        }
    }
}