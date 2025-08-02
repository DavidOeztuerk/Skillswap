using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Integration.UserManagement;
using SkillService.Domain.Entities;
using EventSourcing;
using Events.Domain.Skill;

namespace SkillService.Application.EventHandlers;

/// <summary>
/// Handles UserDeletedEvent to cascade delete all Skills for the deleted user
/// </summary>
public class UserDeletedIntegrationEventHandler(
    SkillDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<UserDeletedIntegrationEventHandler> logger) 
    : BaseDomainEventHandler<UserDeletedEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    protected override async Task HandleDomainEvent(UserDeletedEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing UserDeletedEvent for user {UserId}", integrationEvent.UserId);

        var deletedSkillsCount = 0;

        // Get all Skills for this user to publish deletion events
        var skillsToDelete = await _dbContext.Skills
            .Where(s => s.UserId == integrationEvent.UserId)
            .ToListAsync(cancellationToken);

        if (skillsToDelete.Any())
        {
            // Publish SkillDeletedDomainEvent for each skill to trigger cascading deletes
            foreach (var skill in skillsToDelete)
            {
                await _eventPublisher.Publish(new SkillDeletedDomainEvent(
                    skill.Id,
                    skill.UserId,
                    skill.Name,
                    $"Cascaded deletion due to user account deletion: {integrationEvent.Reason}"), 
                    cancellationToken);
            }

            // Delete all Skills, Reviews, Endorsements, Views, etc. for this user
            _dbContext.Skills.RemoveRange(skillsToDelete);
            deletedSkillsCount = skillsToDelete.Count;
            Logger.LogInformation("Marked {Count} Skills for deletion for user {UserId}", 
                deletedSkillsCount, integrationEvent.UserId);

            // Also clean up related entities
            var reviewsToDelete = await _dbContext.SkillReviews
                .Where(r => r.ReviewerUserId == integrationEvent.UserId)
                .ToListAsync(cancellationToken);

            if (reviewsToDelete.Any())
            {
                _dbContext.SkillReviews.RemoveRange(reviewsToDelete);
                Logger.LogInformation("Marked {Count} SkillReviews for deletion for user {UserId}", 
                    reviewsToDelete.Count, integrationEvent.UserId);
            }

            var endorsementsToDelete = await _dbContext.SkillEndorsements
                .Where(e => e.EndorserUserId == integrationEvent.UserId)
                .ToListAsync(cancellationToken);

            if (endorsementsToDelete.Any())
            {
                _dbContext.SkillEndorsements.RemoveRange(endorsementsToDelete);
                Logger.LogInformation("Marked {Count} SkillEndorsements for deletion for user {UserId}", 
                    endorsementsToDelete.Count, integrationEvent.UserId);
            }

            var viewsToDelete = await _dbContext.SkillViews
                .Where(v => v.ViewerUserId == integrationEvent.UserId)
                .ToListAsync(cancellationToken);

            if (viewsToDelete.Any())
            {
                _dbContext.SkillViews.RemoveRange(viewsToDelete);
                Logger.LogInformation("Marked {Count} SkillViews for deletion for user {UserId}", 
                    viewsToDelete.Count, integrationEvent.UserId);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            Logger.LogInformation("Successfully deleted {SkillsCount} Skills and related entities for user {UserId}", 
                deletedSkillsCount, integrationEvent.UserId);
        }
        else
        {
            Logger.LogInformation("No Skills found for user {UserId}", integrationEvent.UserId);
        }
    }
}