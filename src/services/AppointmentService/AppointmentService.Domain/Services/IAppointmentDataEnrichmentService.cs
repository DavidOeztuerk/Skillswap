using AppointmentService.Domain.Entities;

namespace AppointmentService.Domain.Services;

/// <summary>
/// Service to enrich appointment data with user and skill information
/// This service fetches all necessary data within the AppointmentService
/// to create complete integration events without relying on other services
/// </summary>
public interface IAppointmentDataEnrichmentService
{
    Task<EnrichedAppointmentData> EnrichAppointmentDataAsync(
        Appointment appointment,
        CancellationToken cancellationToken = default);

    Task<EnrichedAppointmentData> EnrichAppointmentDataAsync(
        SessionAppointment appointment,
        CancellationToken cancellationToken = default);
}
