using CQRS.Interfaces;
using Contracts.Appointment.Responses;

namespace AppointmentService.Application.Queries;

public record GetAppointmentDetailsQuery(
    string AppointmentId) : IQuery<GetAppointmentDetailsResponse>, ICacheableQuery
{
    public string CacheKey => $"appointment-details:{AppointmentId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

