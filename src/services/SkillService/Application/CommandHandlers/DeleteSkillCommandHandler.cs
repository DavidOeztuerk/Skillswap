using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Application.Commands;
using EventSourcing;
using Events.Domain.Skill;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;

namespace SkillService.Application.CommandHandlers;

public class DeleteSkillCommandHandler(
    SkillDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<DeleteSkillCommandHandler> logger)
    : BaseCommandHandler<DeleteSkillCommand, DeleteSkillResponse>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<DeleteSkillResponse>> Handle(
        DeleteSkillCommand request,
        CancellationToken cancellationToken)
    {
        var skill = await _dbContext.Skills
            .Include(s => s.Matches.Where(m => m.RequestedSkillId == s.Id || m.OfferedSkillId == s.Id))
            .FirstOrDefaultAsync(s => s.Id == request.SkillId &&
                                     s.UserId == request.UserId &&
                                     !s.IsDeleted, cancellationToken);

        if (skill == null)
        {
            throw new ResourceNotFoundException("Skill", request.SkillId);
        }

        // Check for active matches
        if (skill.Matches.Any())
        {
            throw new Core.Common.Exceptions.InvalidOperationException(
                "DeleteSkill", 
                "HasActiveMatches", 
                "Cannot delete skill with active matches. Please complete or cancel existing matches first.");
        }

            // Soft delete
            skill.IsDeleted = true;
            skill.DeletedAt = DateTime.UtcNow;
            skill.DeletedBy = request.UserId;
            skill.IsActive = false;

            // Update category counts
            var category = await _dbContext.SkillCategories
                .FirstOrDefaultAsync(c => c.Id == skill.SkillCategoryId, cancellationToken);

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
}
