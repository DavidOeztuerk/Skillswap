using AppointmentService.Application.Commands;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;
using Core.Common.Exceptions;
using AppointmentService.Domain.Entities;

namespace AppointmentService.Application.CommandHandlers;

public class RateAppointmentCommandHandler(
    AppointmentDbContext dbContext,
    ILogger<RateAppointmentCommandHandler> logger)
    : BaseCommandHandler<RateAppointmentCommand, bool>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<bool>> Handle(
        RateAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appt = await _dbContext.Appointments.FirstOrDefaultAsync(a => a.Id == request.AppointmentId, cancellationToken);
        if (appt == null)
        {
            return Error("Appointment not found", ErrorCodes.ResourceNotFound);
        }

        // Only allow rating after completion
        if (appt.Status != AppointmentStatus.Completed)
        {
            return Error("Appointment must be completed before rating", ErrorCodes.InvalidOperation);
        }

        // For now, we simply accept rating and feedback without persisting (schema minimal)
        // TODO: Persist ratings in a separate aggregate/table
        Logger.LogInformation("Received rating for appointment {AppointmentId}: {Rating} - {Feedback}",
            appt.Id, request.Rating, request.Feedback);

        return Success(true, "Rating submitted");
    }
}
