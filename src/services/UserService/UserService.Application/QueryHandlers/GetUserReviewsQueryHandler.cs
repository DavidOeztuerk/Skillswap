using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class GetUserReviewsQueryHandler(
    IUserReviewRepository reviewRepository,
    IUserRepository userRepository,
    ILogger<GetUserReviewsQueryHandler> logger)
    : BasePagedQueryHandler<GetUserReviewsQuery, UserReviewResponse>(logger)
{
  private readonly IUserReviewRepository _reviewRepository = reviewRepository;
  private readonly IUserRepository _userRepository = userRepository;

  public override async Task<PagedResponse<UserReviewResponse>> Handle(
      GetUserReviewsQuery request,
      CancellationToken cancellationToken)
  {
    Logger.LogInformation(
        "Getting reviews for user {UserId}, page {PageNumber}, size {PageSize}",
        request.UserId,
        request.PageNumber,
        request.PageSize);

    var reviews = await _reviewRepository.GetUserReviewsWithReviewer(
        request.UserId,
        request.PageNumber,
        request.PageSize,
        cancellationToken);

    var totalCount = await _reviewRepository.GetUserReviewCount(request.UserId, cancellationToken);

    var response = reviews.Select(r =>
    {
      var reviewerName = r.Reviewer != null
              ? $"{r.Reviewer.FirstName} {r.Reviewer.LastName}".Trim()
              : "Unbekannt";
      var reviewerAvatarUrl = r.Reviewer?.ProfilePictureUrl;

      return new UserReviewResponse(
              r.Id,
              r.ReviewerId,
              reviewerName,
              reviewerAvatarUrl,
              r.Rating,
              r.ReviewText,
              r.SkillId,
              null, // SkillName - TODO: Load from SkillService if needed
              r.CreatedAt);
    }).ToList();

    return Success(response, request.PageNumber, request.PageSize, totalCount);
  }
}
