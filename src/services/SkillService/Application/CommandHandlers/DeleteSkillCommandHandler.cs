using MediatR;
using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;
using SkillService.Application.Commands;
using SkillService.Domain.Entities;
using EventSourcing;
using Events.Domain.Skill;

namespace SkillService.Application.CommandHandlers;

// ============================================================================
// DELETE SKILL COMMAND HANDLER
// ============================================================================

public class DeleteSkillCommandHandler : BaseCommandHandler<DeleteSkillCommand, DeleteSkillResponse>
{
    private readonly SkillDbContext _dbContext;
    private readonly IDomainEventPublisher _eventPublisher;

    public DeleteSkillCommandHandler(
        SkillDbContext dbContext,
        IDomainEventPublisher eventPublisher,
        ILogger<DeleteSkillCommandHandler> logger) : base(logger)
    {
        _dbContext = dbContext;
        _eventPublisher = eventPublisher;
    }

    public override async Task<ApiResponse<DeleteSkillResponse>> Handle(
        DeleteSkillCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var skill = await _dbContext.Skills
                .Include(s => s.Matches.Where(m => m.Status == MatchStatus.Pending || m.Status == MatchStatus.Accepted))
                .FirstOrDefaultAsync(s => s.Id == request.SkillId &&
                                         s.UserId == request.UserId &&
                                         !s.IsDeleted, cancellationToken);

            if (skill == null)
            {
                return Error("Skill not found or you don't have permission to delete it");
            }

            // Check for active matches
            if (skill.Matches.Any())
            {
                return Error("Cannot delete skill with active matches. Please complete or cancel existing matches first.");
            }

            // Soft delete
            skill.IsDeleted = true;
            skill.DeletedAt = DateTime.UtcNow;
            skill.DeletedBy = request.UserId;
            skill.IsActive = false;

            // Update category counts
            var category = await _dbContext.SkillCategories
                .FirstOrDefaultAsync(c => c.Id == skill.SkillCategoryId, cancellationToken);

            if (category != null)
            {
                category.SkillCount--;
                category.ActiveSkillCount--;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new SkillDeletedDomainEvent(
                skill.Id,
                skill.UserId,
                skill.Name,
                request.Reason ?? "User requested deletion"), cancellationToken);

            Logger.LogInformation("Skill {SkillId} ({SkillName}) deleted by user {UserId}. Reason: {Reason}",
                skill.Id, skill.Name, request.UserId, request.Reason ?? "Not specified");

            var response = new DeleteSkillResponse(
                skill.Id,
                true,
                DateTime.UtcNow);

            return Success(response, "Skill deleted successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error deleting skill {SkillId} for user {UserId}", request.SkillId, request.UserId);
            return Error("An error occurred while deleting the skill. Please try again.");
        }
    }
}
