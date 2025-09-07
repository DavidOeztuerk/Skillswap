using AppointmentService.Application.Commands;
using AppointmentService.Application.Services;
using AppointmentService.Domain.Entities;
using Contracts.Appointment.Responses;
using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Events.Domain.Appointment;
using Events.Integration.AppointmentManagement;
using EventSourcing;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.CommandHandlers;

public class RescheduleAppointmentCommandHandler(
    AppointmentDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IAppointmentDataEnrichmentService enrichmentService,
    ILogger<RescheduleAppointmentCommandHandler> logger)
    : BaseCommandHandler<RescheduleAppointmentCommand, RescheduleAppointmentResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IAppointmentDataEnrichmentService _enrichmentService = enrichmentService;

    public override async Task<ApiResponse<RescheduleAppointmentResponse>> Handle(
        RescheduleAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        {
            var appointment = await _dbContext.Appointments
                .FirstOrDefaultAsync(a => a.Id == request.AppointmentId && !a.IsDeleted, cancellationToken);

            if (appointment == null)
            {
                throw new ResourceNotFoundException("Appointment", "unknown");
            }

            if (appointment.OrganizerUserId != request.UserId && appointment.ParticipantUserId != request.UserId)
            {
                return Error("You are not authorized to reschedule this appointment", ErrorCodes.InsufficientPermissions);
            }

            if (appointment.Status == AppointmentStatus.Cancelled || appointment.Status == AppointmentStatus.Completed)
            {
                return Error($"Cannot reschedule a {appointment.Status.ToLower()} appointment", ErrorCodes.InvalidOperation);
            }

            // Check for scheduling conflicts
            var newEndTime = request.NewScheduledDate.DateTime.AddMinutes(request.NewDurationMinutes ?? appointment.DurationMinutes);
            var conflictingAppointments = await _dbContext.Appointments
                .Where(a => !a.IsDeleted && a.Id != appointment.Id)
                .Where(a => a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.Completed)
                .Where(a => (a.OrganizerUserId == request.UserId || a.ParticipantUserId == request.UserId))
                .Where(a => a.ScheduledDate < newEndTime && 
                           a.ScheduledDate.AddMinutes(a.DurationMinutes) > request.NewScheduledDate.DateTime)
                .ToListAsync(cancellationToken);

            if (conflictingAppointments.Any())
            {
                return Error("The new time conflicts with another appointment", ErrorCodes.BusinessRuleViolation);
            }

            var oldScheduledDate = appointment.ScheduledDate;
            var oldDurationMinutes = appointment.DurationMinutes;
            appointment.Reschedule(request.NewScheduledDate.DateTime, request.NewDurationMinutes, request.Reason);
            await _dbContext.SaveChangesAsync(cancellationToken);

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
