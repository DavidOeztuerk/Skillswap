using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Application.Commands;
using SkillService.Domain.Entities;
using Events.Domain.Skill;
using EventSourcing;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
namespace SkillService.Application.CommandHandlers;

public class RateSkillCommandHandler : BaseCommandHandler<RateSkillCommand, RateSkillResponse>
{
    private readonly SkillDbContext _dbContext;
    private readonly IDomainEventPublisher _eventPublisher;

    public RateSkillCommandHandler(
        SkillDbContext dbContext,
        IDomainEventPublisher eventPublisher,
        ILogger<RateSkillCommandHandler> logger) : base(logger)
    {
        _dbContext = dbContext;
        _eventPublisher = eventPublisher;
    }

    public override async Task<ApiResponse<RateSkillResponse>> Handle(
        RateSkillCommand request,
        CancellationToken cancellationToken)
    {
        {
            // Validate skill exists
            var skill = await _dbContext.Skills
                .FirstOrDefaultAsync(s => s.Id == request.SkillId &&
                                         !s.IsDeleted, cancellationToken);

            if (skill == null)
            {
                throw new ResourceNotFoundException("Skill", "unknown");
            }

            // Prevent self-rating
            if (skill.UserId == request.UserId)
            {
                return Error("Cannot rate your own skill", ErrorCodes.BusinessRuleViolation);
            }

            // Check if user already rated this skill
            var existingReview = await _dbContext.SkillReviews
                .FirstOrDefaultAsync(r => r.SkillId == request.SkillId &&
                                         r.ReviewerUserId == request.UserId &&
                                         !r.IsDeleted, cancellationToken);

            if (existingReview != null)
            {
                return Error("You have already rated this skill", ErrorCodes.BusinessRuleViolation);
            }

            // Create new review
            var review = new SkillReview
            {
                SkillId = request.SkillId,
                ReviewerUserId = request.UserId!,
                ReviewedUserId = skill.UserId,
                Rating = request.Rating,
                Comment = request.Comment?.Trim(),
                Tags = request.Tags ?? new List<string>(),
                IsVerified = false, // Could be set to true if user had a session
                IsVisible = true,
                CreatedBy = request.UserId
            };

            _dbContext.SkillReviews.Add(review);

            // Recalculate skill rating
            var allReviews = await _dbContext.SkillReviews
                .Where(r => r.SkillId == request.SkillId && r.IsVisible && !r.IsDeleted)
                .ToListAsync(cancellationToken);

            allReviews.Add(review); // Include the new review

            var newAverageRating = allReviews.Average(r => r.Rating);
            var newReviewCount = allReviews.Count;

            skill.UpdateRating(newAverageRating, newReviewCount);

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new SkillRatedDomainEvent(
                request.SkillId,
                skill.UserId,
                request.UserId!,
                request.Rating,
                newAverageRating,
                newReviewCount), cancellationToken);

            Logger.LogInformation("Skill {SkillId} rated {Rating} stars by user {ReviewerUserId}",
                request.SkillId, request.Rating, request.UserId);

            var response = new RateSkillResponse(
                review.Id,
                request.Rating,
                Math.Round(newAverageRating, 2),
                newReviewCount);

            return Success(response, "Skill rated successfully");
        }
    }
}
