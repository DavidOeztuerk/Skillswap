using AppointmentService.Application.Commands;
using AppointmentService.Domain.Services;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.CommandHandlers;

public class GenerateMeetingLinkCommandHandler : BaseCommandHandler<GenerateMeetingLinkCommand, string>
{
    private readonly IAppointmentUnitOfWork _unitOfWork;
    private readonly IMeetingLinkService _meetingLinkService;

    public GenerateMeetingLinkCommandHandler(
        IAppointmentUnitOfWork unitOfWork,
        IMeetingLinkService meetingLinkService,
        ILogger<GenerateMeetingLinkCommandHandler> logger) : base(logger)
    {
        _unitOfWork = unitOfWork;
        _meetingLinkService = meetingLinkService;
    }

    public override async Task<ApiResponse<string>> Handle(
        GenerateMeetingLinkCommand request,
        CancellationToken cancellationToken)
    {
        {
            var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(request.AppointmentId, cancellationToken);

            if (appointment == null)
            {
                return Error("Termin nicht gefunden", ErrorCodes.ResourceNotFound);
            }

            if (appointment.Status != SessionAppointmentStatus.Confirmed)
            {
                return Error("Meeting-Link kann nur für bestätigte Termine generiert werden", ErrorCodes.InvalidOperation);
            }

            // Check if appointment is too far in the future
            if ((appointment.ScheduledDate - DateTime.UtcNow).TotalDays > 7)
            {
                return Error("Meeting-Link kann maximal 7 Tage im Voraus generiert werden", ErrorCodes.BusinessRuleViolation);
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
    }
}