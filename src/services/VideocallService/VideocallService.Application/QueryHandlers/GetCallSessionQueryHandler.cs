using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Queries;
using VideocallService.Domain.Repositories;
using VideocallService.Domain.Entities;

namespace VideocallService.Application.QueryHandlers;

public class GetCallSessionQueryHandler(
    IVideocallUnitOfWork unitOfWork,
    ILogger<GetCallSessionQueryHandler> logger)
    : BaseQueryHandler<GetCallSessionQuery, CallSessionResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;

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

                callSession = sessions
                    .Where(s => s.Status == CallStatus.Pending || s.Status == CallStatus.Active)
                    .OrderByDescending(s => s.CreatedAt)
                    .FirstOrDefault();

                if (callSession != null)
                {
                    Logger.LogInformation("✅ [GetCallSession] Found session by AppointmentId: {SessionId}", callSession.Id);
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

            var response = new CallSessionResponse(
                callSession.Id,
                callSession.RoomId,
                callSession.InitiatorUserId,
                "Initiator User", // TODO: Fetch from UserService if needed
                callSession.ParticipantUserId,
                "Participant User", // TODO: Fetch from UserService if needed
                callSession.Status,
                callSession.StartedAt,
                callSession.EndedAt,
                callSession.ActualDurationMinutes,
                callSession.Participants.Select(p => new CallParticipantResponse(
                    p.UserId,
                    "User Name", // TODO: Fetch from UserService if needed
                    p.ConnectionId,
                    p.JoinedAt,
                    p.CameraEnabled,
                    p.MicrophoneEnabled,
                    p.ScreenShareEnabled
                )).ToList(),
                callSession.IsRecorded,
                callSession.RecordingUrl
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
