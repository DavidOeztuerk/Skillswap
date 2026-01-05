using AppointmentService.Application.Queries;
using AppointmentService.Domain.Repositories;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.QueryHandlers;

public class GetUserReviewsQueryHandler(
    IAppointmentUnitOfWork unitOfWork,
    ILogger<GetUserReviewsQueryHandler> logger)
    : BasePagedQueryHandler<GetUserReviewsQuery, UserReviewResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<PagedResponse<UserReviewResponse>> Handle(
        GetUserReviewsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Retrieving reviews for user {UserId} with star filter {StarFilter}",
            request.UserId, request.StarFilter);

        var reviews = await _unitOfWork.SessionRatings.GetUserReviewsWithPaginationAsync(
            request.UserId,
            request.PageNumber,
            request.PageSize,
            request.StarFilter,
            cancellationToken);

        var totalCount = await _unitOfWork.SessionRatings.GetUserReviewsCountAsync(
            request.UserId,
            request.StarFilter,
            cancellationToken);

        var reviewResponses = reviews.Select(r => new UserReviewResponse(
            r.Id,
            r.RaterId,
            r.RateeId,
            r.Rating,
            r.Feedback,
            r.WouldRecommend,
            r.CreatedAt,
            r.KnowledgeRating,
            r.KnowledgeComment,
            r.TeachingRating,
            r.TeachingComment,
            r.CommunicationRating,
            r.CommunicationComment,
            r.ReliabilityRating,
            r.ReliabilityComment,
            r.SkillId,
            r.SkillName,
            r.ReviewerName,
            r.ReviewerAvatarUrl,
            r.RateeResponse,
            r.RateeResponseAt
        )).ToList();

        Logger.LogInformation("Retrieved {Count} reviews for user {UserId}", reviewResponses.Count, request.UserId);

        return Success(reviewResponses, request.PageNumber, request.PageSize, totalCount);
    }
}
