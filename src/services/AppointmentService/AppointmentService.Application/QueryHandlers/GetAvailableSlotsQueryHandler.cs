using AppointmentService.Application.Queries;
using AppointmentService.Domain.Services;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.QueryHandlers;

public class GetAvailableSlotsQueryHandler(
    IAvailableSlotFinderService slotFinderService,
    ILogger<GetAvailableSlotsQueryHandler> logger)
    : BaseQueryHandler<GetAvailableSlotsQuery, GetAvailableSlotsResponse>(logger)
{
    private readonly IAvailableSlotFinderService _slotFinderService = slotFinderService;

    public override async Task<ApiResponse<GetAvailableSlotsResponse>> Handle(
        GetAvailableSlotsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation(
            "Finding available slots between users {UserId1} and {UserId2} for {Duration} min sessions",
            request.UserId,
            request.OtherUserId,
            request.SessionDurationMinutes);

        if (string.IsNullOrEmpty(request.UserId))
        {
            return Error("User ID is required", "VALIDATION_ERROR");
        }

        if (string.IsNullOrEmpty(request.OtherUserId))
        {
            return Error("Other user ID is required", "VALIDATION_ERROR");
        }

        // Use defaults if no preferences specified
        var preferredDays = request.PreferredDaysOfWeek ?? new List<int> { 1, 2, 3, 4, 5 }; // Mon-Fri
        var preferredTimes = request.PreferredTimeSlots ?? new List<string> { "09:00-18:00" }; // Business hours

        // Find available slots using the existing service
        var availableSlots = await _slotFinderService.FindAvailableSlotsAsync(
            request.UserId,
            request.OtherUserId,
            preferredDays,
            preferredTimes,
            request.SessionDurationMinutes,
            request.NumberOfSlots,
            cancellationToken);

        // Convert to response DTOs
        var slotDtos = availableSlots.Select(slot => new AvailableSlotDto(
            StartTime: slot,
            EndTime: slot.AddMinutes(request.SessionDurationMinutes),
            DurationMinutes: request.SessionDurationMinutes,
            DayOfWeek: slot.DayOfWeek.ToString(),
            IsPreferredTime: IsInPreferredTimeRange(slot, preferredTimes)
        )).ToList();

        var response = new GetAvailableSlotsResponse(
            Slots: slotDtos,
            UserId1: request.UserId,
            UserId2: request.OtherUserId,
            SessionDurationMinutes: request.SessionDurationMinutes,
            GeneratedAt: DateTime.UtcNow);

        Logger.LogInformation("Found {Count} available slots", slotDtos.Count);

        return Success(response, $"Found {slotDtos.Count} available slots");
    }

    private static bool IsInPreferredTimeRange(DateTime slot, List<string> preferredTimeSlots)
    {
        var slotTime = slot.TimeOfDay;

        foreach (var timeSlot in preferredTimeSlots)
        {
            var parts = timeSlot.Split('-');
            if (parts.Length != 2) continue;

            if (TimeSpan.TryParse(parts[0], out var start) &&
                TimeSpan.TryParse(parts[1], out var end))
            {
                if (slotTime >= start && slotTime < end)
                {
                    return true;
                }
            }
        }

        return false;
    }
}
