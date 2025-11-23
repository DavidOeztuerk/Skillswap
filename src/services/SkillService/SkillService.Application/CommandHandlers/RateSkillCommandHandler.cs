using CQRS.Handlers;
using SkillService.Application.Commands;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class RateSkillCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<RateSkillCommandHandler> logger) 
    : BaseCommandHandler<RateSkillCommand, RateSkillResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<RateSkillResponse>> Handle(
        RateSkillCommand request,
        CancellationToken cancellationToken)
    {
        // Validate skill exists
        var skill = await _unitOfWork.Skills
            .GetByIdAsync(request.SkillId, cancellationToken) ?? throw new ResourceNotFoundException("Skill", request.SkillId);

        // Prevent self-rating
        if (skill.UserId == request.UserId)
        {
            return Error("Cannot rate your own skill", ErrorCodes.BusinessRuleViolation);
        }

        // Check if user already rated this skill
        var existingReview = await _unitOfWork.SkillReviews
            .GetBySkillAndUserAsync(request.SkillId, request.UserId!, includeDeleted: false, cancellationToken);

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

        await _unitOfWork.SkillReviews.CreateAsync(review, cancellationToken);

        // Recalculate skill rating
        var allReviews = await _unitOfWork.SkillReviews
            .GetVisibleReviewsBySkillAsync(request.SkillId, cancellationToken);

        allReviews.Add(review); // Include the new review

        var newAverageRating = allReviews.Average(r => r.Rating);
        var newReviewCount = allReviews.Count;

        skill.UpdateRating(newAverageRating, newReviewCount);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

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
