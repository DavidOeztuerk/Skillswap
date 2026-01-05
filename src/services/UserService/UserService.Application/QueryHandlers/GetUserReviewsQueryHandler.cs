using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class GetUserReviewsQueryHandler(
    IUserReviewRepository reviewRepository,
    ILogger<GetUserReviewsQueryHandler> logger)
    : BasePagedQueryHandler<GetUserReviewsQuery, UserReviewResponse>(logger)
{
    private readonly IUserReviewRepository _reviewRepository = reviewRepository;

    public override async Task<PagedResponse<UserReviewResponse>> Handle(
        GetUserReviewsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation(
            "Getting reviews for user {UserId}, page {PageNumber}, size {PageSize}",
            request.UserId,
            request.PageNumber,
            request.PageSize);

        var reviews = await _reviewRepository.GetUserReviews(
            request.UserId,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        var totalCount = await _reviewRepository.GetUserReviewCount(request.UserId, cancellationToken);

        var response = reviews.Select(r => new UserReviewResponse(
            r.Id,
            r.ReviewerId,
            r.ReviewerName ?? "Unbekannt",
            r.ReviewerAvatarUrl,
            r.Rating,
            r.ReviewText,
            r.SkillId,
            r.SkillName,
            r.CreatedAt)).ToList();

        return Success(response, request.PageNumber, request.PageSize, totalCount);
    }
}
