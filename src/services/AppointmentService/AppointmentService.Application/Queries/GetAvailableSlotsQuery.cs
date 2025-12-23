using CQRS.Interfaces;
using Contracts.Appointment.Responses;

namespace AppointmentService.Application.Queries;

/// <summary>
/// Query to find available time slots for scheduling between two users
/// </summary>
public record GetAvailableSlotsQuery(
    string OtherUserId,
    List<int>? PreferredDaysOfWeek = null,
    List<string>? PreferredTimeSlots = null,
    int SessionDurationMinutes = 60,
    int NumberOfSlots = 10) : IQuery<GetAvailableSlotsResponse>, ICacheableQuery
{
    public string? UserId { get; set; }

    public string CacheKey => $"available-slots:{UserId}:{OtherUserId}:{SessionDurationMinutes}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}
