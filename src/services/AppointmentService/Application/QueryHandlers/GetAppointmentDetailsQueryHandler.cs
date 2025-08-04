using AppointmentService.Application.Queries;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.QueryHandlers;

public class GetAppointmentDetailsQueryHandler(
    AppointmentDbContext dbContext,
    ILogger<GetAppointmentDetailsQueryHandler> logger)
    : BaseQueryHandler<GetAppointmentDetailsQuery, AppointmentDetailsResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<AppointmentDetailsResponse>> Handle(
        GetAppointmentDetailsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Retrieving appointment details for ID: {AppointmentId}", request.AppointmentId);

            var appointment = await _dbContext.Appointments
                .FirstOrDefaultAsync(a => a.Id == request.AppointmentId, cancellationToken);

            if (appointment == null)
            {
                return Error("Appointment not found");
            }

            var response = new AppointmentDetailsResponse(
                appointment.Id,
                appointment.Title,
                appointment.Description,
                appointment.ScheduledDate,
                appointment.DurationMinutes,
                appointment.OrganizerUserId,
                "Organizer Name", // This would come from user service
                appointment.ParticipantUserId,
                "Participant Name", // This would come from user service
                appointment.Status,
                appointment.SkillId,
                appointment.MatchId,
                appointment.MeetingType ?? "VideoCall",
                appointment.MeetingLink,
                appointment.CreatedAt,
                appointment.AcceptedAt,
                appointment.CompletedAt,
                appointment.CancelledAt);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving appointment details for ID: {AppointmentId}", request.AppointmentId);
            return Error("An error occurred while retrieving appointment details");
        }
    }
}