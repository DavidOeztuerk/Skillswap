using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Queries;
using VideocallService.Domain.Repositories;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Services;

namespace VideocallService.Application.QueryHandlers;

public class GetCallSessionQueryHandler(
    IVideocallUnitOfWork unitOfWork,
    IUserServiceClient userServiceClient,
    ILogger<GetCallSessionQueryHandler> logger)
    : BaseQueryHandler<GetCallSessionQuery, CallSessionResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

    public override async Task<ApiResponse<CallSessionResponse>> Handle(
        GetCallSessionQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("🔍 [GetCallSession] Fetching call session: {SessionId}", request.SessionId);

            // Try SessionId first (GUID)
            var callSession = await _unitOfWork.VideoCallSessions
                .GetByIdWithParticipantsAsync(request.SessionId, cancellationToken);

            // Try RoomId if not found
            if (callSession == null)
            {
                Logger.LogInformation("🔍 [GetCallSession] Session not found by Id, trying RoomId: {RoomId}", request.SessionId);
                callSession = await _unitOfWork.VideoCallSessions
                    .GetByRoomIdAsync(request.SessionId, cancellationToken);

                if (callSession != null)
                {
                    Logger.LogInformation("✅ [GetCallSession] Found session by RoomId: {SessionId}", callSession.Id);
                    // Reload with participants
                    callSession = await _unitOfWork.VideoCallSessions
                        .GetByIdWithParticipantsAsync(callSession.Id, cancellationToken);
                }
            }

            // Try AppointmentId if still not found
            if (callSession == null)
            {
                Logger.LogInformation("🔍 [GetCallSession] Session not found by RoomId, trying AppointmentId: {AppointmentId}", request.SessionId);
                var sessions = await _unitOfWork.VideoCallSessions
                    .GetSessionsByAppointmentIdAsync(request.SessionId, cancellationToken);

                // KORRIGIERT: Auch "Completed" Sessions finden, damit User wieder beitreten können
                // solange die Appointment-Zeit noch nicht abgelaufen ist.
                // Priorisierung: Active > Pending > Completed (neueste zuerst)
                callSession = sessions
                    .Where(s => s.Status == CallStatus.Active)
                    .OrderByDescending(s => s.CreatedAt)
                    .FirstOrDefault();

                if (callSession == null)
                {
                    callSession = sessions
                        .Where(s => s.Status == CallStatus.Pending)
                        .OrderByDescending(s => s.CreatedAt)
                        .FirstOrDefault();
                }

                // Fallback: Auch abgeschlossene Sessions (für Wiedereintritt während Appointment-Zeit)
                if (callSession == null)
                {
                    callSession = sessions
                        .Where(s => s.Status == CallStatus.Completed)
                        .OrderByDescending(s => s.CreatedAt)
                        .FirstOrDefault();

                    if (callSession != null)
                    {
                        Logger.LogInformation("🔄 [GetCallSession] Found completed session by AppointmentId, allowing re-entry: {SessionId}", callSession.Id);
                    }
                }

                if (callSession != null)
                {
                    Logger.LogInformation("✅ [GetCallSession] Found session by AppointmentId: {SessionId}, Status: {Status}",
                        callSession.Id, callSession.Status);
                    // Reload with participants
                    callSession = await _unitOfWork.VideoCallSessions
                        .GetByIdWithParticipantsAsync(callSession.Id, cancellationToken);
                }
            }

            if (callSession == null)
            {
                Logger.LogWarning("⚠️ [GetCallSession] Call session not found: {SessionId}", request.SessionId);
                return NotFound("Call session not found");
            }

            // Fetch user profiles from UserService
            var userIds = new List<string> { callSession.InitiatorUserId, callSession.ParticipantUserId };
            userIds.AddRange(callSession.Participants.Select(p => p.UserId));
            userIds = userIds.Distinct().ToList();

            var userProfiles = await _userServiceClient.GetUserProfilesBatchAsync(userIds, cancellationToken);
            var userNameMap = userProfiles.ToDictionary(
                p => p.UserId,
                p => $"{p.FirstName} {p.LastName}".Trim()
            );
            var userAvatarMap = userProfiles.ToDictionary(
                p => p.UserId,
                p => p.ProfilePictureUrl
            );

            var initiatorName = userNameMap.GetValueOrDefault(callSession.InitiatorUserId, "Unbekannt");
            var participantName = userNameMap.GetValueOrDefault(callSession.ParticipantUserId, "Unbekannt");
            var initiatorAvatarUrl = userAvatarMap.GetValueOrDefault(callSession.InitiatorUserId);
            var participantAvatarUrl = userAvatarMap.GetValueOrDefault(callSession.ParticipantUserId);

            Logger.LogDebug("📋 [GetCallSession] User names: Initiator={InitiatorName}, Participant={ParticipantName}",
                initiatorName, participantName);

            var response = new CallSessionResponse(
                callSession.Id,
                callSession.RoomId,
                callSession.InitiatorUserId,
                initiatorName,
                initiatorAvatarUrl,
                callSession.ParticipantUserId,
                participantName,
                participantAvatarUrl,
                callSession.Status,
                callSession.StartedAt,
                callSession.EndedAt,
                callSession.ActualDurationMinutes,
                callSession.Participants.Select(p => new CallParticipantResponse(
                    p.UserId,
                    userNameMap.GetValueOrDefault(p.UserId, "Teilnehmer"),
                    p.ConnectionId,
                    p.JoinedAt,
                    p.CameraEnabled,
                    p.MicrophoneEnabled,
                    p.ScreenShareEnabled
                )).ToList(),
                callSession.IsRecorded,
                callSession.RecordingUrl,
                callSession.ThreadId
            );

            Logger.LogInformation("✅ [GetCallSession] Call session found: {SessionId}, Status: {Status}",
                callSession.Id, callSession.Status);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "❌ [GetCallSession] Error retrieving call session {SessionId}", request.SessionId);
            return Error("An error occurred while retrieving the call session");
        }
    }
}
