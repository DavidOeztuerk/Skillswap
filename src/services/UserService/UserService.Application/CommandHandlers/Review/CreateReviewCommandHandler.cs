using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Review;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Review;

public class CreateReviewCommandHandler(
    IUserReviewRepository reviewRepository,
    IUserRepository userRepository,
    ILogger<CreateReviewCommandHandler> logger)
    : BaseCommandHandler<CreateReviewCommand, UserReviewResponse>(logger)
{
    private readonly IUserReviewRepository _reviewRepository = reviewRepository;
    private readonly IUserRepository _userRepository = userRepository;

    public override async Task<ApiResponse<UserReviewResponse>> Handle(
        CreateReviewCommand request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation(
            "Creating review from {ReviewerId} to {RevieweeId} with rating {Rating}",
            request.ReviewerId,
            request.RevieweeId,
            request.Rating);

        // Validate: Can't review yourself
        if (request.ReviewerId == request.RevieweeId)
        {
            return Error("Du kannst dich nicht selbst bewerten");
        }

        // Validate: Check if reviewee exists
        var reviewee = await _userRepository.GetUserById(request.RevieweeId, cancellationToken);
        if (reviewee == null)
        {
            return Error("Der zu bewertende Benutzer wurde nicht gefunden");
        }

        // Validate: Check if already reviewed this session (if session provided)
        if (!string.IsNullOrEmpty(request.SessionId))
        {
            var existingReview = await _reviewRepository.GetReviewBySessionId(
                request.ReviewerId,
                request.SessionId,
                cancellationToken);

            if (existingReview != null)
            {
                return Error("Du hast diese Session bereits bewertet");
            }
        }

        // Create review (Phase 9: cached fields removed - load on read instead)
        var review = UserReview.Create(
            reviewerId: request.ReviewerId,
            revieweeId: request.RevieweeId,
            rating: request.Rating,
            reviewText: request.ReviewText,
            sessionId: request.SessionId,
            skillId: request.SkillId);

        await _reviewRepository.AddReview(review, cancellationToken);

        Logger.LogInformation("Review {ReviewId} created successfully", review.Id);

        // Load reviewer info for response (Phase 9: no longer cached)
        var reviewer = await _userRepository.GetUserById(request.ReviewerId, cancellationToken);
        var reviewerName = reviewer != null ? $"{reviewer.FirstName} {reviewer.LastName}".Trim() : "Unbekannt";
        var reviewerAvatarUrl = reviewer?.ProfilePictureUrl;

        // TODO Phase 9: Load skill name from SkillService if needed
        string? skillName = null;

        var response = new UserReviewResponse(
            review.Id,
            review.ReviewerId,
            reviewerName,
            reviewerAvatarUrl,
            review.Rating,
            review.ReviewText,
            review.SkillId,
            skillName,
            review.CreatedAt);

        return Success(response, "Bewertung erfolgreich erstellt");
    }
}
