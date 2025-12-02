using System.Security.Claims;
using Contracts.VideoCall.Requests;
using Contracts.Appointment.Responses;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using Infrastructure.Communication;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using VideocallService.Application.Commands;
using VideocallService.Application.Queries;
using VideocallService.Hubs;
using VideocallService.Infrastructure.Data;

namespace VideocallService.Extensions;

public static class VideocallControllerExtensions
{
    public static RouteGroupBuilder MapVideocallController(this IEndpointRouteBuilder builder)
    {
        var sessions = builder.MapGroup("/api/videocall/sessions")
            .RequireAuthorization(policy => policy.RequireRole("Service"))
            .WithTags("VideoCalls - Internal");

        sessions.MapPost("/create", async (IMediator mediator, IServiceCommunicationManager serviceCommunication, ILogger<Program> logger, [FromBody] CreateCallSessionRequest request) =>
        {
            // Fetch appointment details to get participant IDs
            var appointment = await serviceCommunication.GetAsync<GetAppointmentDetailsResponse>(
                "AppointmentService",
                $"/api/appointments/{request.AppointmentId}");

            if (appointment == null)
            {
                return Results.NotFound(new { error = "Appointment not found" });
            }

            // Log user ID mapping
            logger.LogInformation(
                "🔍 [CreateCallSession] Mapping user IDs from Appointment {AppointmentId}: " +
                "OrganizerUserId={OrganizerUserId} → InitiatorUserId, " +
                "ParticipantUserId={ParticipantUserId} → ParticipantUserId",
                request.AppointmentId,
                appointment.OrganizerUserId,
                appointment.ParticipantUserId);

            var command = new CreateCallSessionCommand(
                appointment.ParticipantUserId,
                request.AppointmentId,
                appointment.MatchId,
                false,
                request.MaxParticipants)
            {
                UserId = appointment.OrganizerUserId
            };
            return await mediator.SendCommand(command);
        })
        .WithName("CreateSessionInternal")
        .WithSummary("Create video session (Service-to-Service)")
        .WithDescription("Creates a new video call session for service-to-service communication with M2M authentication");

        // Grouped endpoints for calls
        RouteGroupBuilder calls = builder.MapGroup("/api/calls").WithTags("VideoCalls");

        calls.MapPost("/create", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] CreateCallSessionRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CreateCallSessionCommand(userId, request.AppointmentId, null, false, request.MaxParticipants) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("CreateCallSession")
        .WithSummary("Create a new video call session")
        .WithDescription("Creates a new video call session for the authenticated user.")
        .RequireAuthorization();

        calls.MapPost("/join", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] JoinCallRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new JoinCallCommand(request.SessionId, request.ConnectionId, request.CameraEnabled, request.MicrophoneEnabled, request.DeviceInfo) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("JoinCall")
        .WithSummary("Join a video call session")
        .WithDescription("Joins a video call session for the authenticated user.")
        .RequireAuthorization();

        calls.MapPost("/leave", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] LeaveCallRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new LeaveCallCommand(request.SessionId) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("LeaveCall")
        .WithSummary("Leave a video call session")
        .WithDescription("Leaves a video call session for the authenticated user.")
        .RequireAuthorization();

        calls.MapPost("/start", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] StartCallRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new StartCallCommand(request.SessionId) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("StartCall")
        .WithSummary("Start a video call session")
        .WithDescription("Starts a video call session for the authenticated user.")
        .RequireAuthorization();

        calls.MapPost("/end", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] EndCallRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new EndCallCommand(request.SessionId, request.DurationSeconds, request.Rating, request.Feedback) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("EndCall")
        .WithSummary("End a video call session")
        .WithDescription("Ends a video call session for the authenticated user.")
        .RequireAuthorization();

        calls.MapGet("/{sessionId}", async (IMediator mediator, ClaimsPrincipal claims, string sessionId) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetCallSessionQuery(sessionId);
            return await mediator.SendQuery(query);
        })
        .WithName("GetCallSession")
        .WithSummary("Get call session details")
        .WithDescription("Retrieves details for a specific call session.");

        // Add /config alias for the same endpoint (for frontend compatibility)
        calls.MapGet("/{sessionId}/config", async (IMediator mediator, ClaimsPrincipal claims, string sessionId) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetCallSessionQuery(sessionId);
            return await mediator.SendQuery(query);
        })
        .WithName("GetCallSessionConfig")
        .WithSummary("Get call session configuration")
        .WithDescription("Retrieves configuration for a specific call session (alias for GetCallSession).");

        // Grouped endpoints for user call history
        var myCalls = builder.MapGroup("/api/my/calls").WithTags("VideoCalls");
        myCalls.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [AsParameters] GetUserCallHistoryRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetUserCallHistoryQuery(userId, request.FromDate, request.ToDate, request.Status, request.PageNumber, request.PageSize);
            return await mediator.SendQuery(query);
        })
        .WithName("GetMyCallHistory")
        .WithSummary("Get my call history")
        .WithDescription("Retrieves the authenticated user's call history.")
        .RequireAuthorization();

        // Grouped endpoints for analytics
        var analytics = builder.MapGroup("/api/statistics").WithTags("Analytics");
        analytics.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [AsParameters] GetCallStatisticsRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetCallStatisticsQuery(request.FromDate, request.ToDate);
            return await mediator.SendQuery(query);
        })
        .WithName("GetCallStatistics")
        .WithSummary("Get call statistics")
        .WithDescription("Retrieves call statistics.");

        // Grouped endpoints for health
        var health = builder.MapGroup("/health").WithTags("Health");
        health.MapGet("/ready", async (VideoCallDbContext dbContext) =>
        {
            try
            {
                await dbContext.Database.CanConnectAsync();
                return Results.Ok(new
                {
                    status = "ready",
                    timestamp = DateTime.UtcNow,
                    signalr = "enabled"
                });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Health check failed: {ex.Message}");
            }
        })
        .WithName("HealthReady")
        .WithSummary("Readiness check");

        health.MapGet("/live", () => Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow }))
        .WithName("HealthLive")
        .WithSummary("Liveness check");

        return calls;
    }
}