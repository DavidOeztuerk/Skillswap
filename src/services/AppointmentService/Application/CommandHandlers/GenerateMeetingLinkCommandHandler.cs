using AppointmentService.Application.Commands;
using AppointmentService.Application.Services;
using AppointmentService.Domain.Entities;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.CommandHandlers;

public class GenerateMeetingLinkCommandHandler : BaseCommandHandler<GenerateMeetingLinkCommand, string>
{
    private readonly AppointmentDbContext _dbContext;
    private readonly IMeetingLinkService _meetingLinkService;

    public GenerateMeetingLinkCommandHandler(
        AppointmentDbContext dbContext,
        IMeetingLinkService meetingLinkService,
        ILogger<GenerateMeetingLinkCommandHandler> logger) : base(logger)
    {
        _dbContext = dbContext;
        _meetingLinkService = meetingLinkService;
    }

    public override async Task<ApiResponse<string>> Handle(
        GenerateMeetingLinkCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var appointment = await _dbContext.Appointments
                .FirstOrDefaultAsync(a => a.Id == request.AppointmentId, cancellationToken);

            if (appointment == null)
            {
                return Error("Termin nicht gefunden");
            }

            if (appointment.Status != AppointmentStatus.Accepted)
            {
                return Error("Meeting-Link kann nur für bestätigte Termine generiert werden");
            }

            // Check if appointment is too far in the future
            if ((appointment.ScheduledDate - DateTime.UtcNow).TotalDays > 7)
            {
                return Error("Meeting-Link kann maximal 7 Tage im Voraus generiert werden");
            }

            // Generate meeting link with 5-minute activation delay
            var meetingLink = await _meetingLinkService.GenerateMeetingLinkAsync(
                request.AppointmentId, 
                cancellationToken);

            Logger.LogInformation(
                "Generated meeting link for appointment {AppointmentId}",
                request.AppointmentId);

            return Success(meetingLink, "Meeting-Link wurde erfolgreich generiert. Der Link wird in 5 Minuten aktiviert.");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error generating meeting link for appointment {AppointmentId}", 
                request.AppointmentId);
            return Error("Fehler beim Generieren des Meeting-Links");
        }
    }
}