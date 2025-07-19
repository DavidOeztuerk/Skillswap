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

            // TODO: Immediately try to find matches for this new skill
            // This could be done by publishing a FindMatchCommand
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SkillCreatedEvent for skill {SkillId}",
                context.Message.SkillId);
            throw;
        }
    }
}