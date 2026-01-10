using AppointmentService.Application.Commands;
using AppointmentService.Domain.Services;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Enums;
using AppointmentService.Domain.Repositories;
using Contracts.Appointment.Responses;
using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Events.Domain.Appointment;
using Events.Integration.AppointmentManagement;
using EventSourcing;
using Microsoft.Extensions.Logging;
using MassTransit;

namespace AppointmentService.Application.CommandHandlers;

public class RescheduleAppointmentCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IAppointmentDataEnrichmentService enrichmentService,
    ILogger<RescheduleAppointmentCommandHandler> logger)
    : BaseCommandHandler<RescheduleAppointmentCommand, RescheduleAppointmentResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IAppointmentDataEnrichmentService _enrichmentService = enrichmentService;

    public override async Task<ApiResponse<RescheduleAppointmentResponse>> Handle(
        RescheduleAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        {
            var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(request.AppointmentId, cancellationToken);

            if (appointment == null || appointment.IsDeleted)
            {
                throw new ResourceNotFoundException("Appointment", "unknown");
            }

            if (appointment.OrganizerUserId != request.UserId && appointment.ParticipantUserId != request.UserId)
            {
                return Error("You are not authorized to reschedule this appointment", ErrorCodes.InsufficientPermissions);
            }

            if (appointment.Status == SessionAppointmentStatus.Cancelled || appointment.Status == SessionAppointmentStatus.Completed)
            {
                return Error($"Cannot reschedule a {appointment.Status.ToString().ToLowerInvariant()} appointment", ErrorCodes.InvalidOperation);
            }

            // Check for scheduling conflicts
            var newDurationMinutes = request.NewDurationMinutes ?? appointment.DurationMinutes;

            // Determine which user is rescheduling
            var userId = appointment.OrganizerUserId == request.UserId
                ? appointment.OrganizerUserId
                : appointment.ParticipantUserId;

            var hasConflict = await _unitOfWork.SessionAppointments.HasRescheduleConflictAsync(
                userId,
                request.NewScheduledDate.DateTime,
                newDurationMinutes,
                request.AppointmentId,
                cancellationToken);

            if (hasConflict)
            {
                return Error("The new time conflicts with another appointment", ErrorCodes.BusinessRuleViolation);
            }

            var oldScheduledDate = appointment.ScheduledDate;
            var oldDurationMinutes = appointment.DurationMinutes;

            // Use the request/approve pattern for rescheduling
            appointment.RequestReschedule(
                request.UserId!,
                request.NewScheduledDate.DateTime,
                request.NewDurationMinutes,
                request.Reason ?? "Reschedule requested");

            // Immediately approve to apply the changes (backwards compatibility)
            appointment.ApproveReschedule();

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Enrich appointment data with user and skill information
            var enrichedData = await _enrichmentService.EnrichAppointmentDataAsync(appointment, cancellationToken);
            
            // Determine who rescheduled and who the other participant is
            var rescheduledByUser = request.UserId == enrichedData.Organizer.UserId 
                ? enrichedData.Organizer 
                : enrichedData.Participant;
                
            var otherParticipant = request.UserId == enrichedData.Organizer.UserId 
                ? enrichedData.Participant 
                : enrichedData.Organizer;

            // Publish integration event for NotificationService
            await _publishEndpoint.Publish(new AppointmentRescheduledIntegrationEvent
            {
                AppointmentId = appointment.Id,
                OldScheduledDate = oldScheduledDate,
                NewScheduledDate = request.NewScheduledDate.DateTime,
                OldDurationMinutes = oldDurationMinutes,
                NewDurationMinutes = appointment.DurationMinutes,
                Reason = request.Reason,
                MeetingLink = appointment.MeetingLink,
                
                // User who requested the reschedule
                RescheduledByUserId = rescheduledByUser.UserId,
                RescheduledByEmail = rescheduledByUser.Email,
                RescheduledByFirstName = rescheduledByUser.FirstName,
                RescheduledByLastName = rescheduledByUser.LastName,
                
                // Other participant
                OtherParticipantUserId = otherParticipant.UserId,
                OtherParticipantEmail = otherParticipant.Email,
                OtherParticipantFirstName = otherParticipant.FirstName,
                OtherParticipantLastName = otherParticipant.LastName,
                OtherParticipantPhoneNumber = otherParticipant.PhoneNumber,
                
                // Skill information
                SkillId = enrichedData.Skill?.SkillId,
                SkillName = enrichedData.Skill?.Name,
                SkillCategory = enrichedData.Skill?.Category,
                
                // Metadata
                RescheduledAt = DateTime.UtcNow
            }, cancellationToken);

            // Also publish domain event for internal processing
            await _eventPublisher.Publish(new AppointmentRescheduledDomainEvent(
                appointment.Id,
                request.UserId!,
                otherParticipant.UserId,
                oldScheduledDate,
                request.NewScheduledDate.DateTime,
                oldDurationMinutes,
                appointment.DurationMinutes,
                request.Reason,
                enrichedData.Skill?.Name), 
                cancellationToken);

            var response = new RescheduleAppointmentResponse(
                appointment.Id,
                new DateTimeOffset(appointment.ScheduledDate, TimeSpan.Zero),
                appointment.DurationMinutes,
                new DateTimeOffset(appointment.UpdatedAt!.Value, TimeSpan.Zero));

            return Success(response, "Appointment rescheduled successfully");
        }
    }
}
