using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using CQRS.Extensions;
using Infrastructure.Extensions;
using Contracts.Appointment.Requests;
using AppointmentService.Application.Queries;
using AppointmentService.Application.Commands;
using MediatR;

namespace AppointmentService.Extensions;

public static class AppointmentControllerExtensions
{
    public static RouteGroupBuilder MapApppointmentsController(
        this IEndpointRouteBuilder builder)
    {
        var appointments = builder.MapGroup("/appointments").WithTags("Appointments");

        appointments.MapPost("/", HandleCreateAppointment)
            .WithName("CreateAppointment")
            .WithSummary("Create a new appointment")
            .WithDescription("Creates a new appointment for the authenticated user.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/accept", HandleAcceptAppointment)
            .WithName("AcceptAppointment")
            .WithSummary("Accept an appointment")
            .WithDescription("Accepts an appointment for the authenticated user.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/cancel", HandleCancelAppointment)
            .WithName("CancelAppointment")
            .WithSummary("Cancel an appointment")
            .WithDescription("Cancels an appointment for the authenticated user.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/reschedule", HandleRescheduleAppointment)
            .WithName("RescheduleAppointment")
            .WithSummary("Reschedule an appointment")
            .WithDescription("Reschedules an appointment to a new date and time.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/meeting-link", HandleGenerateMeetingLink)
            .WithName("GenerateMeetingLink")
            .WithSummary("Generate meeting link")
            .WithDescription("Generates a meeting link for the appointment with 5-minute activation delay.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/complete", HandleCompleteAppointment)
            .WithName("CompleteAppointment")
            .WithSummary("Complete an appointment")
            .WithDescription("Marks an appointment as completed with optional rating and feedback.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/rate", HandleRateAppointment)
            .WithName("RateAppointment")
            .WithSummary("Rate a completed appointment")
            .WithDescription("Submits a rating and optional feedback for a completed appointment.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/reminder", HandleSendReminder)
            .WithName("SendAppointmentReminder")
            .WithSummary("Send appointment reminder")
            .WithDescription("Sends a reminder notification for the appointment to both participants.")
            .RequireAuthorization();

        appointments.MapGet("/statistics", HandleGetAppointmentStatistics)
            .WithName("GetAppointmentStatistics")
            .WithSummary("Get appointment statistics")
            .WithDescription("Retrieves aggregated statistics for the current user's appointments.")
            .RequireAuthorization();

        appointments.MapGet("/{appointmentId}", HandleGetAppointmentDetails)
            .WithName("GetAppointmentDetails")
            .WithSummary("Get appointment details")
            .WithDescription("Retrieves details for a specific appointment.");

        // Grouped endpoints for user appointments
        var myAppointments = builder.MapGroup("/my/appointments")
            .WithTags("Appointments");

        myAppointments.MapGet("/", HandleGetUserAppointments)
            .WithName("GetMyAppointments")
            .WithSummary("Get my appointments")
            .WithDescription("Retrieves all appointments for the authenticated user.")
            .RequireAuthorization();

        // ============================================================================
        // HANDLER METHODS
        // ============================================================================

        static async Task<IResult> HandleCreateAppointment(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateAppointmentRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CreateAppointmentCommand(
                request.Title,
                request.Description,
                request.ScheduledDate,
                request.DurationMinutes,
                request.ParticipantUserId,
                request.SkillId,
                request.MeetingType)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleAcceptAppointment(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] AcceptAppointmentRequest? request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new AcceptAppointmentCommand(appointmentId)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleCancelAppointment(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] CancelAppointmentRequest? request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CancelAppointmentCommand(appointmentId, request?.Reason)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleGetAppointmentDetails(IMediator mediator, ClaimsPrincipal user, string appointmentId)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetAppointmentDetailsQuery(appointmentId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleGetUserAppointments(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetUserAppointmentsRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetUserAppointmentsQuery(
                userId,
                request.Status,
                request.FromDate,
                request.ToDate,
                request.IncludePast,
                request.PageNumber,
                request.PageSize);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleRescheduleAppointment(IMediator mediator, ClaimsPrincipal user, 
            [FromRoute] string appointmentId, [FromBody] RescheduleAppointmentRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RescheduleAppointmentCommand(
                appointmentId,
                request.NewScheduledDate,
                request.NewDurationMinutes,
                request.Reason)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleGenerateMeetingLink(IMediator mediator, ClaimsPrincipal user, string appointmentId)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new GenerateMeetingLinkCommand(appointmentId);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleCompleteAppointment(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] CompleteAppointmentRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CompleteAppointmentCommand(appointmentId, request.SessionDurationMinutes, request.Feedback, request.Rating)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleRateAppointment(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] RateAppointmentRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RateAppointmentCommand(appointmentId, request.Rating, request.Feedback)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleSendReminder(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] SendReminderRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new SendReminderCommand(appointmentId, request.MinutesBefore)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleGetAppointmentStatistics(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetAppointmentStatisticsQuery(userId);
            return await mediator.SendQuery(query);
        }

        return appointments;
    }
}
