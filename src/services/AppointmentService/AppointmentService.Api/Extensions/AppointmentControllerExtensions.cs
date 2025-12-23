using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using CQRS.Extensions;
using Infrastructure.Extensions;
using Contracts.Appointment.Requests;
using AppointmentService.Application.Queries;
using AppointmentService.Application.Commands;
using MediatR;

namespace AppointmentService.Api.Extensions;

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

        // ============================================================================
        // SESSION LIFECYCLE ENDPOINTS
        // ============================================================================

        appointments.MapPost("/{appointmentId}/start", HandleStartSession)
            .WithName("StartSession")
            .WithSummary("Start a session")
            .WithDescription("Starts a confirmed appointment session.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/complete-session", HandleCompleteSession)
            .WithName("CompleteSession")
            .WithSummary("Complete a session")
            .WithDescription("Marks a session as completed or no-show with optional reason.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/rate-session", HandleRateSession)
            .WithName("RateSession")
            .WithSummary("Rate a session")
            .WithDescription("Submits a detailed rating for a completed session with feedback and recommendation.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/reschedule-session", HandleRescheduleSession)
            .WithName("RescheduleSession")
            .WithSummary("Request session reschedule")
            .WithDescription("Requests to reschedule a session to a new date.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/cancel-session", HandleCancelSession)
            .WithName("CancelSession")
            .WithSummary("Cancel a session")
            .WithDescription("Cancels a session with optional reason (tracks late cancellations).")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/payment", HandleProcessPayment)
            .WithName("ProcessSessionPayment")
            .WithSummary("Process session payment")
            .WithDescription("Processes payment for a completed session.")
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

        appointments.MapPost("/available-slots", HandleGetAvailableSlots)
            .WithName("GetAvailableSlots")
            .WithSummary("Get available time slots")
            .WithDescription("Finds available time slots for scheduling between the current user and another user. Uses POST due to complex query parameters.")
            .RequireAuthorization();

        appointments.MapGet("/{appointmentId}", HandleGetAppointmentDetails)
            .WithName("GetAppointmentDetails")
            .WithSummary("Get appointment details")
            .WithDescription("Retrieves details for a specific appointment.");

        appointments.MapPut("/{appointmentId}", HandleUpdateAppointment)
            .WithName("UpdateAppointment")
            .WithSummary("Update appointment details")
            .WithDescription("Updates the title, description, or meeting link of an appointment.")
            .RequireAuthorization();

        appointments.MapPost("/{appointmentId}/report", HandleReportAppointment)
            .WithName("ReportAppointment")
            .WithSummary("Report appointment")
            .WithDescription("Reports a problematic appointment for moderation review.")
            .RequireAuthorization();

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

        static async Task<IResult> HandleCreateAppointment(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateAppointmentRequest request, ILogger<Program> logger)
        {
            logger.LogInformation("🚀 HandleCreateAppointment: Received appointment creation request from User");

            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                logger.LogWarning("⚠️ HandleCreateAppointment: Unauthorized - No UserId found in claims");
                return Results.Unauthorized();
            }

            logger.LogInformation("✅ HandleCreateAppointment: UserId: {UserId}, Title: {Title}, ScheduledDate: {ScheduledDate}, ParticipantId: {ParticipantId}",
                userId, request.Title, request.ScheduledDate, request.ParticipantUserId);

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

            logger.LogInformation("📤 HandleCreateAppointment: Sending command to MediatR...");
            var result = await mediator.SendCommand(command);
            logger.LogInformation("✅ HandleCreateAppointment: Command processed, returning result");
            return result;
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

        static async Task<IResult> HandleGetAvailableSlots(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] GetAvailableSlotsRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetAvailableSlotsQuery(
                request.OtherUserId,
                request.PreferredDaysOfWeek,
                request.PreferredTimeSlots,
                request.SessionDurationMinutes,
                request.NumberOfSlots)
            {
                UserId = userId
            };

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleUpdateAppointment(
            IMediator mediator,
            ClaimsPrincipal user,
            string appointmentId,
            [FromBody] UpdateAppointmentRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateAppointmentCommand(
                appointmentId,
                request.Title,
                request.Description,
                request.MeetingLink)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleReportAppointment(
            IMediator mediator,
            ClaimsPrincipal user,
            string appointmentId,
            [FromBody] ReportAppointmentRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new ReportAppointmentCommand(
                appointmentId,
                request.Reason,
                request.Details)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        // ============================================================================
        // SESSION LIFECYCLE HANDLERS
        // ============================================================================

        static async Task<IResult> HandleStartSession(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] StartSessionRequest? request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new StartSessionCommand(appointmentId, userId);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleCompleteSession(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] CompleteSessionRequest? request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CompleteSessionCommand(
                appointmentId,
                userId,
                request?.IsNoShow ?? false,
                request?.NoShowReason);

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleRateSession(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] RateSessionRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RateSessionCommand(
                appointmentId,
                userId,
                request.Rating,
                request.Feedback,
                request.IsPublic,
                request.WouldRecommend,
                request.Tags);

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleRescheduleSession(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] RescheduleSessionRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RescheduleSessionCommand(
                appointmentId,
                userId,
                request.ProposedDate,
                request.ProposedDurationMinutes,
                request.Reason);

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleCancelSession(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] CancelSessionRequest? request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CancelSessionCommand(
                appointmentId,
                userId,
                request?.Reason ?? "User requested cancellation");

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleProcessPayment(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] ProcessSessionPaymentRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new ProcessSessionPaymentCommand(
                appointmentId,
                userId,
                request.PayeeId,
                request.Amount,
                request.Currency,
                request.PaymentMethodToken,
                request.PlatformFeePercent);

            return await mediator.SendCommand(command);
        }

        return appointments;
    }
}
