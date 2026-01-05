using AppointmentService.Application.Queries;
using AppointmentService.Domain.Repositories;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.QueryHandlers;

public class GetUserReviewStatsQueryHandler(
    IAppointmentUnitOfWork unitOfWork,
    ILogger<GetUserReviewStatsQueryHandler> logger)
    : BaseQueryHandler<GetUserReviewStatsQuery, UserReviewStatsResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<UserReviewStatsResponse>> Handle(
        GetUserReviewStatsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Retrieving review stats for user {UserId}", request.UserId);

        // Get rating distribution
        var distribution = await _unitOfWork.SessionRatings.GetRatingDistributionAsync(
            request.UserId,
            cancellationToken);

        // Get section averages
        var sectionAverages = await _unitOfWork.SessionRatings.GetSectionAveragesAsync(
            request.UserId,
            cancellationToken);

        // Calculate overall stats
        var totalReviews = distribution.Values.Sum();
        var averageRating = totalReviews > 0
            ? distribution.Sum(kv => kv.Key * kv.Value) / (double)totalReviews
            : 0.0;

        var response = new UserReviewStatsResponse(
            request.UserId,
            Math.Round(averageRating, 2),
            totalReviews,
            distribution,
            sectionAverages.avgKnowledge.HasValue ? Math.Round(sectionAverages.avgKnowledge.Value, 2) : null,
            sectionAverages.avgTeaching.HasValue ? Math.Round(sectionAverages.avgTeaching.Value, 2) : null,
            sectionAverages.avgCommunication.HasValue ? Math.Round(sectionAverages.avgCommunication.Value, 2) : null,
            sectionAverages.avgReliability.HasValue ? Math.Round(sectionAverages.avgReliability.Value, 2) : null
        );

        Logger.LogInformation("Retrieved review stats for user {UserId}: {TotalReviews} reviews, {AverageRating} avg",
            request.UserId, totalReviews, averageRating);

        return Success(response);
    }
}
