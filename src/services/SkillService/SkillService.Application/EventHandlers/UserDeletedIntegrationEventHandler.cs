using CQRS.Handlers;
using Events.Integration.UserManagement;
using EventSourcing;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

/// <summary>
/// Handles UserDeletedEvent to cascade delete all Skills for the deleted user
/// </summary>
public class UserDeletedIntegrationEventHandler(
    ISkillUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    ILogger<UserDeletedIntegrationEventHandler> logger) 
    : BaseDomainEventHandler<UserDeletedEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    protected override async Task HandleDomainEvent(UserDeletedEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing UserDeletedEvent for user {UserId}", integrationEvent.UserId);

        var deletedSkillsCount = 0;

        // Get all Skills for this user to publish deletion events
        var skillsToDelete = await _unitOfWork.Skills
            .GetUserSkillsAsync(integrationEvent.UserId, cancellationToken);

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
            _unitOfWork.Skills.RemoveRange(skillsToDelete);
            deletedSkillsCount = skillsToDelete.Count;
            Logger.LogInformation("Marked {Count} Skills for deletion for user {UserId}", 
                deletedSkillsCount, integrationEvent.UserId);

            // Also clean up related entities
            var reviewsToDelete = await _unitOfWork.SkillReviews
                .GetByReviewerUserIdAsync(integrationEvent.UserId, cancellationToken);

            if (reviewsToDelete.Any())
            {
                _unitOfWork.SkillReviews.RemoveRange(reviewsToDelete);
                Logger.LogInformation("Marked {Count} SkillReviews for deletion for user {UserId}",
                    reviewsToDelete.Count, integrationEvent.UserId);
            }

            var endorsementsToDelete = await _unitOfWork.SkillEndorsements
                .GetByEndorserUserIdAsync(integrationEvent.UserId, cancellationToken);

            if (endorsementsToDelete.Any())
            {
                _unitOfWork.SkillEndorsements.RemoveRange(endorsementsToDelete);
                Logger.LogInformation("Marked {Count} SkillEndorsements for deletion for user {UserId}",
                    endorsementsToDelete.Count, integrationEvent.UserId);
            }

            var viewsToDelete = await _unitOfWork.SkillViews
                .GetByViewerUserIdAsync(integrationEvent.UserId, cancellationToken);

            if (viewsToDelete.Any())
            {
                _unitOfWork.SkillViews.RemoveRange(viewsToDelete);
                Logger.LogInformation("Marked {Count} SkillViews for deletion for user {UserId}",
                    viewsToDelete.Count, integrationEvent.UserId);
            }

            // Clean up favorites for this user
            await _unitOfWork.SkillFavorites.RemoveAllForUserAsync(integrationEvent.UserId, cancellationToken);
            Logger.LogInformation("Removed all SkillFavorites for user {UserId}", integrationEvent.UserId);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            Logger.LogInformation("Successfully deleted {SkillsCount} Skills and related entities for user {UserId}", 
                deletedSkillsCount, integrationEvent.UserId);
        }
        else
        {
            Logger.LogInformation("No Skills found for user {UserId}", integrationEvent.UserId);
        }
    }
}