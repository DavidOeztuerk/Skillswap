//using CQRS.Handlers;
//using Infrastructure.Models;
//using VideocallService.Application.Queries;

//namespace VideocallService.Application.QueryHandlers;

//// ============================================================================
//// GET CALL SESSION QUERY HANDLER
//// ============================================================================

//public class GetCallSessionQueryHandler(
//    VideoCallDbContext dbContext,
//    ILogger<GetCallSessionQueryHandler> logger)
//    : BaseQueryHandler<GetCallSessionQuery, CallSessionResponse>(logger)
//{
//    private readonly VideoCallDbContext _dbContext = dbContext;

//    public override async Task<ApiResponse<CallSessionResponse>> Handle(
//        GetCallSessionQuery request,
//        CancellationToken cancellationToken)
//    {
//        try
//        {
//            var callSession = await _dbContext.CallSessions
//                .Include(cs => cs.Participants)
//                .Where(cs => cs.Id == request.SessionId)
//                .Select(cs => new CallSessionResponse(
//                    cs.Id,
//                    cs.AppointmentId,
//                    cs.InitiatedBy,
//                    cs.Status,
//                    cs.StartedAt,
//                    cs.EndedAt,
//                    cs.Duration,
//                    cs.Participants.Select(p => new CallParticipantResponse(
//                        p.UserId,
//                        p.JoinedAt,
//                        p.LeftAt,
//                        p.IsActive,
//                        p.Role
//                    )).ToList(),
//                    cs.RecordingUrl,
//                    cs.Quality,
//                    cs.CreatedAt
//                ))
//                .FirstOrDefaultAsync(cancellationToken);

//            if (callSession == null)
//            {
//                Logger.LogWarning("Call session {SessionId} not found", request.SessionId);
//                return NotFound<CallSessionResponse>("Call session not found");
//            }

//            Logger.LogInformation("Retrieved call session {SessionId}", request.SessionId);
//            return Success(callSession);
//        }
//        catch (Exception ex)
//        {
//            Logger.LogError(ex, "Error retrieving call session {SessionId}", request.SessionId);
//            return Error<CallSessionResponse>("An error occurred while retrieving the call session");
//        }
//    }
//}

//public record CallSessionResponse(
//    string Id,
//    string AppointmentId,
//    string InitiatedBy,
//    string Status,
//    DateTime? StartedAt,
//    DateTime? EndedAt,
//    TimeSpan? Duration,
//    List<CallParticipantResponse> Participants,
//    string? RecordingUrl,
//    string? Quality,
//    DateTime CreatedAt);

//public record CallParticipantResponse(
//    string UserId,
//    DateTime? JoinedAt,
//    DateTime? LeftAt,
//    bool IsActive,
//    string Role);