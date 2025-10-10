using AppointmentService.Application.Commands;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;
using Core.Common.Exceptions;
using AppointmentService.Domain.Entities;

namespace AppointmentService.Application.CommandHandlers;

public class CompleteAppointmentCommandHandler(
    AppointmentDbContext dbContext,
    ILogger<CompleteAppointmentCommandHandler> logger)
    : BaseCommandHandler<CompleteAppointmentCommand, CompleteAppointmentResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<CompleteAppointmentResponse>> Handle(
        CompleteAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appt = await _dbContext.Appointments.FirstOrDefaultAsync(a => a.Id == request.AppointmentId, cancellationToken);
        if (appt == null)
        {
            return Error("Appointment not found", ErrorCodes.ResourceNotFound);
        }

        // Only organizer or participant can complete
        if (!string.IsNullOrEmpty(request.UserId) &&
            request.UserId != appt.OrganizerUserId && request.UserId != appt.ParticipantUserId)
        {
            return Error("Not authorized to complete this appointment", ErrorCodes.InsufficientPermissions);
        }

        // Optional: validate it is time to complete
        appt.Complete();

        // If a session duration was provided, adjust duration only if not set
        if (request.SessionDurationMinutes.HasValue && request.SessionDurationMinutes.Value > 0)
        {
            appt.DurationMinutes = request.SessionDurationMinutes.Value;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var resp = new CompleteAppointmentResponse(
            appt.Id,
            appt.Status,
            appt.CompletedAt ?? DateTime.UtcNow);

        return Success(resp, "Appointment completed");
    }
}
