using Events;
using MassTransit;
using MatchmakingService.Models;

namespace MatchmakingService.Consumer;

public class SkillCreatedConsumer(
    MatchmakingDbContext dbContext) 
    : IConsumer<SkillCreatedEvent>
{
    private readonly MatchmakingDbContext _dbContext = dbContext;

    public async Task Consume(ConsumeContext<SkillCreatedEvent> context)
    {
        var newSkill = new Match
        {
            SkillName = context.Message.Name,
            IsMatched = false,
            SkillCreatorId = context.Message.SkillCreatorId // User des Skill-Erstellers speichern
        };
        
        _dbContext.Matches.Add(newSkill);
        await _dbContext.SaveChangesAsync();
    }
}