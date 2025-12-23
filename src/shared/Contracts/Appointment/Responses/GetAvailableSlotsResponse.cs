namespace Contracts.Appointment.Responses;

/// <summary>
/// Response containing available time slots for scheduling
/// </summary>
public record GetAvailableSlotsResponse(
    List<AvailableSlotDto> Slots,
    string UserId1,
    string UserId2,
    int SessionDurationMinutes,
    DateTime GeneratedAt);

/// <summary>
/// A single available time slot
/// </summary>
public record AvailableSlotDto(
    DateTime StartTime,
    DateTime EndTime,
    int DurationMinutes,
    string DayOfWeek,
    bool IsPreferredTime);
