using AppointmentService.Application.Queries;
using AppointmentService.Domain.Enums;
using AppointmentService.Domain.Services;
using AppointmentService.Domain.Repositories;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.QueryHandlers;

public class GetAppointmentDetailsQueryHandler(
    IAppointmentUnitOfWork unitOfWork,
    IAppointmentDataEnrichmentService enrichmentService,
    ILogger<GetAppointmentDetailsQueryHandler> logger)
    : BaseQueryHandler<GetAppointmentDetailsQuery, GetAppointmentDetailsResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IAppointmentDataEnrichmentService _enrichmentService = enrichmentService;

    public override async Task<ApiResponse<GetAppointmentDetailsResponse>> Handle(
        GetAppointmentDetailsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Retrieving session appointment details for ID: {AppointmentId}", request.AppointmentId);

        // Use NEW SessionAppointments repository with includes for SessionSeries and Connection
        var appointment = await _unitOfWork.SessionAppointments.GetWithSeriesAsync(request.AppointmentId, cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("SessionAppointment", request.AppointmentId);
        }

        // Enrich appointment data with user and skill information
        var enrichedData = await _enrichmentService.EnrichAppointmentDataAsync(appointment, cancellationToken);

        // Access SessionSeries and Connection through navigation properties
        var series = appointment.SessionSeries;
        var connection = series?.Connection;

        // Derive flags for frontend compatibility
        var connectionType = connection?.ConnectionType ?? "Free";
        var isSkillExchange = connectionType == "SkillExchange";
        var isMonetary = connectionType == "Payment";

        var response = new GetAppointmentDetailsResponse(
            AppointmentId: appointment.Id,
            Title: appointment.Title,
            Description: appointment.Description,
            ScheduledDate: new DateTimeOffset(appointment.ScheduledDate, TimeSpan.Zero),
            DurationMinutes: appointment.DurationMinutes,
            OrganizerUserId: appointment.OrganizerUserId,
            OrganizerName: $"{enrichedData.Organizer.FirstName} {enrichedData.Organizer.LastName}",
            ParticipantUserId: appointment.ParticipantUserId,
            ParticipantName: $"{enrichedData.Participant.FirstName} {enrichedData.Participant.LastName}",
            Status: appointment.Status.ToString(),
            SkillId: series?.SkillId,
            SkillName: enrichedData.Skill?.Name,
            MatchId: connection?.MatchRequestId, // MatchRequestId is on Connection level
            MeetingType: appointment.MeetingType ?? "VideoCall",
            MeetingLink: appointment.MeetingLink,
            CreatedAt: new DateTimeOffset(appointment.CreatedAt, TimeSpan.Zero),
            UpdatedAt: appointment.UpdatedAt.HasValue ? new DateTimeOffset(appointment.UpdatedAt.Value, TimeSpan.Zero) : null,
            AcceptedAt: appointment.ConfirmedAt.HasValue ? new DateTimeOffset(appointment.ConfirmedAt.Value, TimeSpan.Zero) : null, // Use ConfirmedAt instead of AcceptedAt
            CompletedAt: appointment.CompletedAt.HasValue ? new DateTimeOffset(appointment.CompletedAt.Value, TimeSpan.Zero) : null,
            CancelledAt: appointment.CancelledAt.HasValue ? new DateTimeOffset(appointment.CancelledAt.Value, TimeSpan.Zero) : null,
            CancellationReason: appointment.CancellationReason,
            // Connection data
            ConnectionId: connection?.Id,
            ConnectionType: connectionType,
            ConnectionStatus: connection?.Status.ToString() ?? "Active",
            // Chat/Thread info - ThreadId from MatchRequest for Chat integration
            ThreadId: connection?.ThreadId,
            // Match/Connection Rollen - KONSTANT durch die gesamte Kette
            MatchRequesterId: connection?.RequesterId,
            MatchRequesterName: enrichedData.MatchRequester != null
                ? $"{enrichedData.MatchRequester.FirstName} {enrichedData.MatchRequester.LastName}"
                : null,
            MatchTargetUserId: connection?.TargetUserId,
            MatchTargetUserName: enrichedData.MatchTarget != null
                ? $"{enrichedData.MatchTarget.FirstName} {enrichedData.MatchTarget.LastName}"
                : null,
            // Series data
            SessionSeriesId: series?.Id,
            SessionSeriesTitle: series?.Title,
            SessionNumber: appointment.SessionNumber,
            TotalSessionsInSeries: series?.TotalSessions ?? 1,
            CompletedSessionsInSeries: series?.CompletedSessions ?? 0,
            // Session-specific data
            IsConfirmed: appointment.IsConfirmed,
            IsPaymentCompleted: appointment.IsPaymentCompleted,
            PaymentAmount: appointment.PaymentAmount,
            Currency: appointment.Currency,
            // Derived flags
            IsSkillExchange: isSkillExchange,
            IsMonetary: isMonetary
        );

        return Success(response);
    }
}