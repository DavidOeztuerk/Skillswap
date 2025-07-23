using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using Events.Domain.Appointment;
using EventSourcing;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.CommandHandlers;

public class CreateAppointmentCommandHandler(
    AppointmentDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateAppointmentCommandHandler> logger)
    : BaseCommandHandler<CreateAppointmentCommand, CreateAppointmentResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CreateAppointmentResponse>> Handle(
        CreateAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Check for scheduling conflicts
            var hasConflict = await _dbContext.Appointments
                .AnyAsync(a =>
                    (a.OrganizerUserId == request.UserId || a.ParticipantUserId == request.UserId ||
                     a.OrganizerUserId == request.ParticipantUserId || a.ParticipantUserId == request.ParticipantUserId) &&
                    a.Status != AppointmentStatus.Cancelled &&
                    a.ScheduledDate <= request.ScheduledDate.AddMinutes(request.DurationMinutes) &&
                    a.ScheduledDate.AddMinutes(a.DurationMinutes) >= request.ScheduledDate &&
                    !a.IsDeleted, cancellationToken);

            if (hasConflict)
            {
                return Error("Scheduling conflict detected. Please choose a different time.");
            }

            var appointment = new Appointment
            {
                Title = request.Title,
                Description = request.Description,
                ScheduledDate = request.ScheduledDate,
                DurationMinutes = request.DurationMinutes,
                OrganizerUserId = request.UserId!,
                ParticipantUserId = request.ParticipantUserId,
                SkillId = request.SkillId,
                MatchId = request.MatchId,
                MeetingType = request.MeetingType,
                Location = request.Location,
                CreatedBy = request.UserId
            };

            _dbContext.Appointments.Add(appointment);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new AppointmentCreatedDomainEvent(
                appointment.Id,
                appointment.OrganizerUserId,
                appointment.ParticipantUserId,
                appointment.Title,
                appointment.ScheduledDate,
                appointment.SkillId,
                appointment.MatchId), cancellationToken);

            var response = new CreateAppointmentResponse(
                appointment.Id,
                appointment.Title,
                appointment.ScheduledDate,
                appointment.Status,
                appointment.CreatedAt);

            return Success(response, "Appointment created successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating appointment");
            return Error("An error occurred while creating the appointment");
        }
    }
}