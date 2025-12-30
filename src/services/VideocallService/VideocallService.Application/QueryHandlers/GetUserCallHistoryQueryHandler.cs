using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Queries;
using VideocallService.Domain.Repositories;
using VideocallService.Domain.Services;

namespace VideocallService.Application.QueryHandlers;

public class GetUserCallHistoryQueryHandler(
    IVideocallUnitOfWork unitOfWork,
    IUserServiceClient userServiceClient,
    ILogger<GetUserCallHistoryQueryHandler> logger)
    : BasePagedQueryHandler<GetUserCallHistoryQuery, UserCallHistoryResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

    public override async Task<PagedResponse<UserCallHistoryResponse>> Handle(
        GetUserCallHistoryQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation(
                "Fetching call history for user {UserId}, Page {Page}, Size {Size}",
                request.UserId, request.PageNumber, request.PageSize);

            // Get all sessions for this user
            var allSessions = await _unitOfWork.VideoCallSessions
                .GetUserSessionsAsync(request.UserId, cancellationToken);

            if (allSessions.Count == 0)
            {
                Logger.LogInformation("No call history found for user {UserId}", request.UserId);
                return Success([], request.PageNumber, request.PageSize, 0);
            }

            // Apply filters
            var filteredSessions = allSessions.AsQueryable();

            if (request.FromDate.HasValue)
            {
                filteredSessions = filteredSessions.Where(s => s.CreatedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                filteredSessions = filteredSessions.Where(s => s.CreatedAt <= request.ToDate.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                filteredSessions = filteredSessions.Where(s =>
                    s.Status.Equals(request.Status, StringComparison.OrdinalIgnoreCase));
            }

            // Order by most recent first
            var orderedSessions = filteredSessions
                .OrderByDescending(s => s.CreatedAt)
                .ToList();

            var totalRecords = orderedSessions.Count;

            // Apply pagination
            var pagedSessions = orderedSessions
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            if (pagedSessions.Count == 0)
            {
                return Success([], request.PageNumber, request.PageSize, totalRecords);
            }

            // Get other participant user IDs
            var otherUserIds = pagedSessions
                .Select(s => s.InitiatorUserId == request.UserId
                    ? s.ParticipantUserId
                    : s.InitiatorUserId)
                .Distinct()
                .ToList();

            // Fetch user profiles from UserService
            var userProfiles = await _userServiceClient.GetUserProfilesBatchAsync(otherUserIds, cancellationToken);
            var userNameMap = userProfiles.ToDictionary(
                p => p.UserId,
                p => $"{p.FirstName} {p.LastName}".Trim()
            );

            // Map to response
            var responses = pagedSessions.Select(session =>
            {
                var isInitiator = session.InitiatorUserId == request.UserId;
                var otherUserId = isInitiator ? session.ParticipantUserId : session.InitiatorUserId;
                var otherParticipantName = userNameMap.GetValueOrDefault(otherUserId, "Unknown");

                return new UserCallHistoryResponse(
                    session.Id,
                    otherParticipantName,
                    session.Status,
                    session.CreatedAt,
                    session.StartedAt,
                    session.EndedAt,
                    session.ActualDurationMinutes,
                    isInitiator
                );
            }).ToList();

            Logger.LogInformation(
                "Retrieved {Count} call history records for user {UserId} (Total: {Total})",
                responses.Count, request.UserId, totalRecords);

            return Success(responses, request.PageNumber, request.PageSize, totalRecords);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving call history for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving call history");
        }
    }
}
