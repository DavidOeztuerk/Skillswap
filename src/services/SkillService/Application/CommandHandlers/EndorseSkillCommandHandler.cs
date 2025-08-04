using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Application.Commands;
using SkillService.Domain.Entities;
using EventSourcing;
using Events.Domain.Skill;
using Contracts.Skill.Responses;
using CQRS.Models;

namespace SkillService.Application.CommandHandlers;

public class EndorseSkillCommandHandler : BaseCommandHandler<EndorseSkillCommand, EndorseSkillResponse>
{
    private readonly SkillDbContext _dbContext;
    private readonly IDomainEventPublisher _eventPublisher;

    public EndorseSkillCommandHandler(
        SkillDbContext dbContext,
        IDomainEventPublisher eventPublisher,
        ILogger<EndorseSkillCommandHandler> logger) : base(logger)
    {
        _dbContext = dbContext;
        _eventPublisher = eventPublisher;
    }

    public override async Task<ApiResponse<EndorseSkillResponse>> Handle(
        EndorseSkillCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate skill exists and belongs to the endorsed user
            var skill = await _dbContext.Skills
                .FirstOrDefaultAsync(s => s.Id == request.SkillId &&
                                         s.UserId == request.EndorsedUserId &&
                                         !s.IsDeleted, cancellationToken);

            if (skill == null)
            {
                return Error("Skill not found");
            }

            // Check if user already endorsed this skill
            var existingEndorsement = await _dbContext.SkillEndorsements
                .FirstOrDefaultAsync(e => e.SkillId == request.SkillId &&
                                         e.EndorserUserId == request.UserId &&
                                         !e.IsDeleted, cancellationToken);

            if (existingEndorsement != null)
            {
                return Error("You have already endorsed this skill");
            }

            // Create new endorsement
            var endorsement = new SkillEndorsement
            {
                SkillId = request.SkillId,
                EndorserUserId = request.UserId!,
                EndorsedUserId = request.EndorsedUserId,
                Message = request.Message?.Trim(),
                IsVisible = true,
                CreatedBy = request.UserId
            };

            _dbContext.SkillEndorsements.Add(endorsement);

            // Update skill endorsement count
            skill.IncrementEndorsements();

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new SkillEndorsedDomainEvent(
                request.SkillId,
                request.EndorsedUserId,
                request.UserId!,
                request.Message,
                skill.EndorsementCount), cancellationToken);

            Logger.LogInformation("Skill {SkillId} endorsed by user {EndorserUserId}",
                request.SkillId, request.UserId);

            var response = new EndorseSkillResponse(
                endorsement.Id,
                skill.EndorsementCount);

            return Success(response, "Skill endorsed successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error endorsing skill {SkillId} by user {UserId}", request.SkillId, request.UserId);
            return Error("An error occurred while endorsing the skill. Please try again.");
        }
    }
}