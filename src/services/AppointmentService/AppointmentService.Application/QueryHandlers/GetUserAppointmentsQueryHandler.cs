using AppointmentService.Application.Queries;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Services;
using AppointmentService.Domain.Repositories;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.QueryHandlers;

public class GetUserAppointmentsQueryHandler(
    IAppointmentUnitOfWork unitOfWork,
    IUserServiceClient userServiceClient,
    ILogger<GetUserAppointmentsQueryHandler> logger)
    : BasePagedQueryHandler<GetUserAppointmentsQuery, UserAppointmentItem>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

    public override async Task<PagedResponse<UserAppointmentItem>> Handle(
        GetUserAppointmentsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Retrieving appointments for user {UserId} with parameters: {@Query}", request.UserId, request);

        // Use NEW SessionAppointments repository with includes
        var appointments = await _unitOfWork.SessionAppointments.GetUserAppointmentsWithPaginationAsync(
            request.UserId,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        var totalCount = await _unitOfWork.SessionAppointments.GetUserAppointmentsCountAsync(
            request.UserId,
            cancellationToken);

        // PERFORMANCE FIX: Batch fetch all user names upfront
        var otherPartyUserIds = appointments
            .Select(a => a.OrganizerUserId == request.UserId ? a.ParticipantUserId : a.OrganizerUserId)
            .Distinct()
            .ToList();

        Logger.LogInformation("Batch fetching {Count} user names for {AppointmentCount} appointments",
            otherPartyUserIds.Count, appointments.Count);

        var userNames = await _userServiceClient.GetUserNamesBatchAsync(otherPartyUserIds, cancellationToken);

        Logger.LogInformation("Batch fetch complete: {Count} user names fetched", userNames.Count);

        // Map SessionAppointments to UserAppointmentItem with Connection/Series data
        var appointmentResponses = new List<UserAppointmentItem>();
        foreach (var a in appointments)
        {
            var otherPartyUserId = a.OrganizerUserId == request.UserId ? a.ParticipantUserId : a.OrganizerUserId;
            var otherPartyName = userNames.GetValueOrDefault(otherPartyUserId) ?? $"User {otherPartyUserId.Substring(0, Math.Min(8, otherPartyUserId.Length))}...";

            var series = a.SessionSeries;
            var connection = series?.Connection;

            // Derive flags for frontend compatibility
            var connectionType = connection?.ConnectionType ?? "Free";
            var isSkillExchange = connectionType == "SkillExchange";
            var isMonetary = connectionType == "Payment";

            appointmentResponses.Add(new UserAppointmentItem(
                AppointmentId: a.Id,
                Title: a.Title,
                Description: a.Description,
                ScheduledDate: a.ScheduledDate,
                DurationMinutes: a.DurationMinutes,
                Status: a.Status,
                OtherPartyUserId: otherPartyUserId,
                OtherPartyName: otherPartyName,
                MeetingType: a.MeetingType ?? "VideoCall",
                IsOrganizer: a.OrganizerUserId == request.UserId,
                SkillId: series?.SkillId,
                SkillName: null, // TODO: Batch fetch skill names if needed
                MeetingLink: a.MeetingLink,
                // Connection data
                ConnectionId: connection?.Id,
                ConnectionType: connectionType,
                ConnectionStatus: connection?.Status ?? "Active",
                // Series data
                SessionSeriesId: series?.Id,
                SessionSeriesTitle: series?.Title,
                SessionNumber: a.SessionNumber,
                TotalSessionsInSeries: series?.TotalSessions ?? 1,
                CompletedSessionsInSeries: series?.CompletedSessions ?? 0,
                // Session-specific data
                IsConfirmed: a.IsConfirmed,
                IsPaymentCompleted: a.IsPaymentComplete,
                PaymentAmount: a.PaymentAmount,
                Currency: a.Currency,
                // Derived flags
                IsSkillExchange: isSkillExchange,
                IsMonetary: isMonetary
            ));
        }

        Logger.LogInformation("Retrieved {Count} appointments for user {UserId}", appointmentResponses.Count, request.UserId);

        return Success(appointmentResponses, request.PageNumber, request.PageSize, totalCount);
    }
}
