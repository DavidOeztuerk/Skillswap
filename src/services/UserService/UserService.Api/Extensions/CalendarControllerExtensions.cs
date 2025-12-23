using System.Security.Claims;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Commands.Calendar;
using UserService.Application.Queries.Calendar;

namespace UserService.Api.Extensions;

public static class CalendarControllerExtensions
{
    public static RouteGroupBuilder MapCalendarController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder calendar = builder.MapGroup("/users/calendar")
            .RequireAuthorization()
            .WithTags("Calendar Integration");

        calendar.MapGet("/connections", HandleGetConnections)
            .WithName("GetCalendarConnections")
            .WithSummary("Get calendar connections")
            .WithDescription("Gets the current user's connected calendar providers")
            .Produces<ApiResponse<List<CalendarConnectionResponse>>>(200)
            .Produces(401);

        calendar.MapPost("/connect/{provider}", HandleInitiateConnect)
            .WithName("InitiateCalendarConnect")
            .WithSummary("Initiate calendar connection")
            .WithDescription("For Google/Microsoft: generates OAuth authorization URL. For Apple: connects using credentials from body.")
            .Produces<ApiResponse<InitiateCalendarConnectResponse>>(200)
            .Produces<ApiResponse<CalendarConnectionResponse>>(200)
            .Produces(400)
            .Produces(401);

        calendar.MapGet("/callback", HandleCallback)
            .WithName("CalendarOAuthCallback")
            .WithSummary("OAuth callback")
            .WithDescription("Handles the OAuth callback from calendar providers")
            .AllowAnonymous() // OAuth callback comes from provider redirect
            .Produces<ApiResponse<CalendarConnectionResponse>>(200)
            .Produces(400);

        calendar.MapDelete("/disconnect/{provider}", HandleDisconnect)
            .WithName("DisconnectCalendar")
            .WithSummary("Disconnect calendar")
            .WithDescription("Disconnects the specified calendar provider")
            .Produces<ApiResponse<bool>>(200)
            .Produces(400)
            .Produces(401);

        calendar.MapGet("/busy-times", HandleGetBusyTimes)
            .WithName("GetCalendarBusyTimes")
            .WithSummary("Get busy times")
            .WithDescription("Gets busy time slots from user's connected calendars within a date range")
            .Produces<ApiResponse<ExternalBusyTimesResponse>>(200)
            .Produces(400)
            .Produces(401);

        // Internal endpoint for service-to-service communication
        calendar.MapGet("/{userId}/busy-times", HandleGetBusyTimesForUser)
            .WithName("GetCalendarBusyTimesForUser")
            .WithSummary("Get busy times for user (internal)")
            .WithDescription("Gets busy time slots from a specific user's connected calendars (for service-to-service use)")
            .Produces<ApiResponse<ExternalBusyTimesResponse>>(200)
            .Produces(400);

        // Calendar sync endpoints (for service-to-service communication)
        calendar.MapPost("/{userId}/sync", HandleSyncAppointment)
            .WithName("SyncAppointmentToCalendar")
            .WithSummary("Sync appointment to calendars (internal)")
            .WithDescription("Creates calendar events for an appointment in user's connected calendars")
            .Produces<ApiResponse<CalendarSyncResult>>(200)
            .Produces(400);

        calendar.MapPut("/{userId}/sync/{appointmentId}", HandleUpdateCalendarAppointment)
            .WithName("UpdateCalendarAppointment")
            .WithSummary("Update calendar appointment (internal)")
            .WithDescription("Updates calendar events for an appointment in user's connected calendars")
            .Produces<ApiResponse<CalendarSyncResult>>(200)
            .Produces(400);

        calendar.MapDelete("/{userId}/sync/{appointmentId}", HandleDeleteCalendarAppointment)
            .WithName("DeleteCalendarAppointment")
            .WithSummary("Delete calendar appointment (internal)")
            .WithDescription("Deletes calendar events for an appointment from user's connected calendars")
            .Produces<ApiResponse<CalendarSyncResult>>(200)
            .Produces(400);

        static async Task<IResult> HandleGetConnections(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetCalendarConnectionsQuery(userId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleInitiateConnect(
            IMediator mediator,
            ClaimsPrincipal user,
            string provider,
            [FromQuery] string? redirectUri,
            [FromBody] AppleConnectRequest? appleRequest,
            HttpRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            // Apple uses CalDAV with credentials, not OAuth
            if (provider.Equals("apple", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrEmpty(appleRequest?.Credentials))
                {
                    return Results.BadRequest(ApiResponse<CalendarConnectionResponse>.ErrorResult(
                        "Apple Calendar requires credentials (Apple ID and app-specific password)"));
                }

                var appleCommand = new ConnectAppleCalendarCommand(userId, appleRequest.Credentials);
                return await mediator.SendCommand(appleCommand);
            }

            // For Google/Microsoft, use OAuth flow
            var callbackUri = redirectUri ?? $"{request.Scheme}://{request.Host}/api/users/calendar/callback";
            var command = new InitiateCalendarConnectCommand(userId, provider, callbackUri);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleCallback(
            IMediator mediator,
            [FromQuery] string? code,
            [FromQuery] string? state,
            [FromQuery] string? error,
            [FromQuery(Name = "error_description")] string? errorDescription,
            HttpRequest request)
        {
            // Handle OAuth errors
            if (!string.IsNullOrEmpty(error))
            {
                return Results.BadRequest(ApiResponse<CalendarConnectionResponse>.ErrorResult(
                    errorDescription ?? error));
            }

            if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
            {
                return Results.BadRequest(ApiResponse<CalendarConnectionResponse>.ErrorResult(
                    "Missing authorization code or state"));
            }

            // Construct redirect URI
            var redirectUri = $"{request.Scheme}://{request.Host}/api/users/calendar/callback";

            var command = new CompleteCalendarConnectCommand(code, state, redirectUri);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleDisconnect(IMediator mediator, ClaimsPrincipal user, string provider)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DisconnectCalendarCommand(userId, provider);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleGetBusyTimes(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromQuery] DateTime startTime,
            [FromQuery] DateTime endTime)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetExternalCalendarBusyTimesQuery(userId, startTime, endTime);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleGetBusyTimesForUser(
            IMediator mediator,
            string userId,
            [FromQuery] DateTime startTime,
            [FromQuery] DateTime endTime)
        {
            // This endpoint is for service-to-service communication
            // Authorization is handled by M2M token validation in middleware

            var query = new GetExternalCalendarBusyTimesQuery(userId, startTime, endTime);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleSyncAppointment(
            IMediator mediator,
            string userId,
            [FromBody] SyncAppointmentRequest request)
        {
            var command = new SyncAppointmentToCalendarCommand(
                request.AppointmentId,
                userId,
                request.Title,
                request.Description,
                request.StartTime,
                request.EndTime,
                request.Location,
                request.MeetingLink,
                request.AttendeeEmails);

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleUpdateCalendarAppointment(
            IMediator mediator,
            string userId,
            string appointmentId,
            [FromBody] SyncAppointmentRequest request)
        {
            var command = new UpdateCalendarAppointmentCommand(
                appointmentId,
                userId,
                request.Title,
                request.Description,
                request.StartTime,
                request.EndTime,
                request.Location,
                request.MeetingLink,
                request.AttendeeEmails);

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleDeleteCalendarAppointment(
            IMediator mediator,
            string userId,
            string appointmentId)
        {
            var command = new DeleteCalendarAppointmentCommand(appointmentId, userId);
            return await mediator.SendCommand(command);
        }

        return calendar;
    }
}

/// <summary>
/// Request model for connecting Apple Calendar via CalDAV
/// </summary>
public record AppleConnectRequest
{
    /// <summary>
    /// Base64-encoded credentials in format "appleId:appPassword"
    /// </summary>
    public string Credentials { get; init; } = string.Empty;
}

/// <summary>
/// Request model for syncing appointment to external calendars
/// </summary>
public record SyncAppointmentRequest
{
    public string AppointmentId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string? Location { get; init; }
    public string? MeetingLink { get; init; }
    public List<string> AttendeeEmails { get; init; } = [];
}
