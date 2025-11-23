using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.CommandHandlers;

public class RateAppointmentCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    ILogger<RateAppointmentCommandHandler> logger)
    : BaseCommandHandler<RateAppointmentCommand, bool>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<bool>> Handle(
        RateAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appt = await _unitOfWork.SessionAppointments.GetByIdAsync(request.AppointmentId, cancellationToken);
        if (appt == null)
        {
            return Error("Appointment not found", ErrorCodes.ResourceNotFound);
        }

        // Only allow rating after completion
        if (appt.Status != SessionAppointmentStatus.Completed)
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
