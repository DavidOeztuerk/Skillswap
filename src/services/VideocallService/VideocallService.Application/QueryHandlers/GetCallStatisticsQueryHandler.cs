using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Queries;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;

namespace VideocallService.Application.QueryHandlers;

public class GetCallStatisticsQueryHandler(
    IVideocallUnitOfWork unitOfWork,
    ILogger<GetCallStatisticsQueryHandler> logger)
    : BaseQueryHandler<GetCallStatisticsQuery, CallStatisticsResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<CallStatisticsResponse>> Handle(
        GetCallStatisticsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation(
                "Fetching call statistics from {FromDate} to {ToDate}",
                request.FromDate, request.ToDate);

            // Get all active/completed sessions
            var allSessions = await _unitOfWork.VideoCallSessions
                .GetActiveSessionsAsync(cancellationToken);

            // Apply date filters
            var sessions = allSessions.AsQueryable();

            if (request.FromDate.HasValue)
            {
                sessions = sessions.Where(s => s.CreatedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                sessions = sessions.Where(s => s.CreatedAt <= request.ToDate.Value);
            }

            var sessionList = sessions.ToList();

            // Calculate statistics
            var totalCalls = sessionList.Count;
            var completedCalls = sessionList.Count(s => s.Status == CallStatus.Completed);
            var cancelledCalls = sessionList.Count(s => s.Status == CallStatus.Cancelled);

            var completedWithDuration = sessionList
                .Where(s => s.Status == CallStatus.Completed && s.ActualDurationMinutes.HasValue)
                .ToList();

            var averageDuration = completedWithDuration.Count > 0
                ? completedWithDuration.Average(s => s.ActualDurationMinutes!.Value)
                : 0;

            var completionRate = totalCalls > 0
                ? (double)completedCalls / totalCalls * 100
                : 0;

            // Unique users
            var allUserIds = sessionList
                .SelectMany(s => new[] { s.InitiatorUserId, s.ParticipantUserId })
                .Distinct()
                .ToList();

            var uniqueUsers = allUserIds.Count;
            var totalParticipants = sessionList.Sum(s => s.ParticipantCount);

            // Calls by hour of day
            var callsByHour = sessionList
                .GroupBy(s => s.CreatedAt.Hour)
                .ToDictionary(
                    g => g.Key.ToString("D2"),
                    g => g.Count()
                );

            // Fill missing hours with 0
            for (var i = 0; i < 24; i++)
            {
                var hourKey = i.ToString("D2");
                callsByHour.TryAdd(hourKey, 0);
            }

            // Sort by hour
            callsByHour = callsByHour
                .OrderBy(kvp => int.Parse(kvp.Key))
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

            // Quality metrics
            var qualityMetrics = new List<CallQualityMetric>();

            var sessionsWithRating = sessionList.Where(s => s.QualityRating.HasValue).ToList();
            if (sessionsWithRating.Count > 0)
            {
                qualityMetrics.Add(new CallQualityMetric(
                    "Average Quality Rating",
                    Math.Round(sessionsWithRating.Average(s => s.QualityRating!.Value), 2),
                    "stars"
                ));
            }

            var sessionsWithIssues = sessionList.Count(s => !string.IsNullOrWhiteSpace(s.TechnicalIssues));
            qualityMetrics.Add(new CallQualityMetric(
                "Calls With Technical Issues",
                sessionsWithIssues,
                "count"
            ));

            var screenShareUsage = totalCalls > 0
                ? (double)sessionList.Count(s => s.ScreenShareUsed) / totalCalls * 100
                : 0;
            qualityMetrics.Add(new CallQualityMetric(
                "Screen Share Usage",
                Math.Round(screenShareUsage, 1),
                "%"
            ));

            var chatUsage = totalCalls > 0
                ? (double)sessionList.Count(s => s.ChatUsed) / totalCalls * 100
                : 0;
            qualityMetrics.Add(new CallQualityMetric(
                "Chat Usage",
                Math.Round(chatUsage, 1),
                "%"
            ));

            var recordingUsage = totalCalls > 0
                ? (double)sessionList.Count(s => s.IsRecorded) / totalCalls * 100
                : 0;
            qualityMetrics.Add(new CallQualityMetric(
                "Recording Usage",
                Math.Round(recordingUsage, 1),
                "%"
            ));

            var response = new CallStatisticsResponse(
                totalCalls,
                completedCalls,
                cancelledCalls,
                Math.Round(averageDuration, 1),
                Math.Round(completionRate, 1),
                totalParticipants,
                uniqueUsers,
                callsByHour,
                qualityMetrics
            );

            Logger.LogInformation(
                "Call statistics retrieved: {TotalCalls} total, {CompletedCalls} completed",
                totalCalls, completedCalls);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving call statistics");
            return Error("An error occurred while retrieving call statistics");
        }
    }
}
