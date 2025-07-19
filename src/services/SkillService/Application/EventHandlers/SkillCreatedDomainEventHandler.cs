using CQRS.Handlers;
using MediatR;
using Events.Domain.Skill;

namespace SkillService.Application.EventHandlers;

public class SkillCreatedDomainEventHandler(
    SkillDbContext dbContext,
    IPublisher publisher, // MediatR Publisher für Integration Events
    ILogger<SkillCreatedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillCreatedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IPublisher _publisher = publisher;

    protected override async Task HandleDomainEvent(SkillCreatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        await Task.CompletedTask;
        // Create activity log entry
        // var activityLog = new SkillView
        // {
        //     SkillId = domainEvent.SkillId,
        //     ViewerUserId = domainEvent.UserId,
        //     ViewSource = ViewSources.Direct,
        //     ViewedAt = DateTime.UtcNow,
        //     ViewDurationSeconds = 0
        // };

        // _dbContext.Set<SkillView>().Add(activityLog);

        // // Update category statistics (bereits im Command Handler gemacht, könnte hier entfernt werden)
        // // ODER hier machen und aus Command Handler entfernen für bessere Trennung
        // var category = await _dbContext.SkillCategories
        //     .FirstOrDefaultAsync(c => c.Id == domainEvent.SkillCategoryId, cancellationToken);

        // if (category != null)
        // {
        //     category.SkillCount++;
        //     category.ActiveSkillCount++;
        //     category.UpdatedAt = DateTime.UtcNow;
        // }

        // await _dbContext.SaveChangesAsync(cancellationToken);

        // // ✅ HIER Integration Event publizieren - NICHT das Domain Event nochmal!
        // // await _publisher.Publish(new SkillCreatedIntegrationEvent(
        // //     domainEvent.SkillId,
        // //     domainEvent.Name,
        // //     domainEvent.Description,
        // //     domainEvent.IsOffering,
        // //     domainEvent.UserId), cancellationToken);

        // Logger.LogInformation("Processed SkillCreatedDomainEvent for skill {SkillId}", domainEvent.SkillId);
    }
}


// public record SkillCreatedIntegrationEvent(
//     string SkillId,
//     string Name,
//     string Description,
//     bool IsOffering,
//     string SkillCreatorId);