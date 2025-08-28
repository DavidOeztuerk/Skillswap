using AppointmentService.Application.Queries;
using AppointmentService.Application.Services;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.QueryHandlers;

public class GetAppointmentDetailsQueryHandler(
    AppointmentDbContext dbContext,
    AppointmentDataEnrichmentService enrichmentService,
    ILogger<GetAppointmentDetailsQueryHandler> logger)
    : BaseQueryHandler<GetAppointmentDetailsQuery, AppointmentDetailsResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;
    private readonly AppointmentDataEnrichmentService _enrichmentService = enrichmentService;

    public override async Task<ApiResponse<AppointmentDetailsResponse>> Handle(
        GetAppointmentDetailsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Retrieving appointment details for ID: {AppointmentId}", request.AppointmentId);

            var appointment = await _dbContext.Appointments
                .AsNoTracking() // Performance: Read-only query
                .FirstOrDefaultAsync(a => a.Id == request.AppointmentId, cancellationToken);

            if (appointment == null)
            {
                return Error("Appointment not found");
            }

            // Enrich appointment data with user and skill information
            var enrichedData = await _enrichmentService.EnrichAppointmentDataAsync(appointment, cancellationToken);

            var response = new AppointmentDetailsResponse(
                appointment.Id,
                appointment.Title,
                appointment.Description,
                new DateTimeOffset(appointment.ScheduledDate, TimeSpan.Zero),
                appointment.DurationMinutes,
                appointment.OrganizerUserId,
                $"{enrichedData.Organizer.FirstName} {enrichedData.Organizer.LastName}",
                appointment.ParticipantUserId,
                $"{enrichedData.Participant.FirstName} {enrichedData.Participant.LastName}",
                appointment.Status,
                appointment.SkillId,
                enrichedData.Skill?.Name,
                appointment.MatchId,
                appointment.MeetingType ?? "VideoCall",
                appointment.MeetingLink,
                new DateTimeOffset(appointment.CreatedAt, TimeSpan.Zero),
                appointment.UpdatedAt.HasValue ? new DateTimeOffset(appointment.UpdatedAt.Value, TimeSpan.Zero) : null,
                appointment.AcceptedAt.HasValue ? new DateTimeOffset(appointment.AcceptedAt.Value, TimeSpan.Zero) : null,
                appointment.CompletedAt.HasValue ? new DateTimeOffset(appointment.CompletedAt.Value, TimeSpan.Zero) : null,
                appointment.CancelledAt.HasValue ? new DateTimeOffset(appointment.CancelledAt.Value, TimeSpan.Zero) : null,
                appointment.CancellationReason);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving appointment details for ID: {AppointmentId}", request.AppointmentId);
            return Error("An error occurred while retrieving appointment details");
        }
    }
}