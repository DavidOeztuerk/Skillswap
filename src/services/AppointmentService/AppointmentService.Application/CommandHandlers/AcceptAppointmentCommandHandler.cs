using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Enums;
using AppointmentService.Domain.Repositories;
using AppointmentService.Domain.Services;
using Contracts.Appointment.Responses;
using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using Events.Domain.Appointment;
using EventSourcing;

namespace AppointmentService.Application.CommandHandlers;

public class AcceptAppointmentCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IMeetingLinkService meetingLinkService,
    ILogger<AcceptAppointmentCommandHandler> logger)
    : BaseCommandHandler<AcceptAppointmentCommand, AcceptAppointmentResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IMeetingLinkService _meetingLinkService = meetingLinkService;

    public override async Task<ApiResponse<AcceptAppointmentResponse>> Handle(
        AcceptAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("✅ [AcceptAppointment] Starting appointment acceptance - AppointmentId: {AppointmentId}, UserId: {UserId}",
            request.AppointmentId, request.UserId);

        // Load appointment with SessionSeries to get SkillId for notifications
        Logger.LogDebug("📂 [AcceptAppointment] Loading appointment with SessionSeries data");
        var appointment = await _unitOfWork.SessionAppointments.GetWithSeriesAsync(request.AppointmentId, cancellationToken);

        if (appointment == null || appointment.IsDeleted)
        {
            Logger.LogError("❌ [AcceptAppointment] Appointment {AppointmentId} not found or deleted", request.AppointmentId);
            throw new ResourceNotFoundException("SessionAppointment", request.AppointmentId);
        }

        Logger.LogInformation("📋 [AcceptAppointment] Appointment loaded - Status: {Status}, OrganizerUserId: {OrganizerUserId}, ParticipantUserId: {ParticipantUserId}",
            appointment.Status, appointment.OrganizerUserId, appointment.ParticipantUserId);

        if (appointment.ParticipantUserId != request.UserId)
        {
            Logger.LogWarning("⚠️ [AcceptAppointment] Authorization failed - User {UserId} is not the participant (ParticipantUserId: {ParticipantUserId})",
                request.UserId, appointment.ParticipantUserId);
            return Error("You are not authorized to accept this appointment", ErrorCodes.InsufficientPermissions);
        }

        if (appointment.Status != SessionAppointmentStatus.Pending)
        {
            Logger.LogWarning("⚠️ [AcceptAppointment] Cannot accept appointment in {Status} status", appointment.Status);
            return Error($"Cannot accept appointment in {appointment.Status} status", ErrorCodes.InvalidOperation);
        }

        // Change status to Confirmed (SessionAppointmentStatus uses "Confirmed" not "Accepted")
        Logger.LogInformation("🔄 [AcceptAppointment] Changing appointment status to Confirmed");
        appointment.Status = SessionAppointmentStatus.Confirmed;
        appointment.UpdatedAt = DateTime.UtcNow;

        // Automatically generate meeting link when appointment is confirmed
        if (string.IsNullOrEmpty(appointment.MeetingLink))
        {
            Logger.LogInformation("🎥 [AcceptAppointment] No meeting link exists - auto-generating...");
            try
            {
                var meetingLink = await _meetingLinkService.GenerateMeetingLinkAsync(appointment.Id, cancellationToken);
                appointment.UpdateMeetingLink(meetingLink);
                Logger.LogInformation("✅ [AcceptAppointment] Auto-generated meeting link for appointment {AppointmentId}: {MeetingLink}",
                    appointment.Id, meetingLink);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex,
                    "❌ [AcceptAppointment] FAILED to auto-generate meeting link for appointment {AppointmentId}. Error: {ErrorMessage}. StackTrace: {StackTrace}",
                    appointment.Id, ex.Message, ex.StackTrace);
                // Don't fail the whole operation if meeting link generation fails
            }
        }
        else
        {
            Logger.LogInformation("ℹ️ [AcceptAppointment] Meeting link already exists: {MeetingLink}", appointment.MeetingLink);
        }

        Logger.LogDebug("💾 [AcceptAppointment] Saving appointment changes to database");
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        Logger.LogInformation("✅ [AcceptAppointment] Appointment saved successfully");

        // Get SkillId from SessionSeries -> Connection
        var skillId = appointment.SessionSeries?.Connection?.SkillId ?? string.Empty;
        Logger.LogInformation("🎯 [AcceptAppointment] SkillId from SessionSeries: {SkillId} (SessionSeries: {HasSeries}, Connection: {HasConnection})",
            skillId, appointment.SessionSeries != null, appointment.SessionSeries?.Connection != null);

        // Publish domain event with proper SkillId
        Logger.LogInformation("📧 [AcceptAppointment] Publishing AppointmentAcceptedDomainEvent");
        await _eventPublisher.Publish(new AppointmentAcceptedDomainEvent(
            appointment.Id,
            request.UserId!,
            appointment.OrganizerUserId,
            appointment.ScheduledDate,
            appointment.DurationMinutes,
            skillId,
            true), // Both parties accepted for SessionAppointments
            cancellationToken);
        Logger.LogInformation("✅ [AcceptAppointment] Domain event published successfully");

        var response = new AcceptAppointmentResponse(
            appointment.Id,
            appointment.Status.ToString(),
            DateTime.UtcNow); // Use current time since SessionAppointment doesn't have AcceptedAt

        Logger.LogInformation("🎉 [AcceptAppointment] Appointment acceptance completed successfully for {AppointmentId}", request.AppointmentId);
        return Success(response, "Appointment accepted successfully");
    }
}
