namespace Contracts.Appointment.Requests;

/// <summary>
/// Request for getting user appointments with filtering and pagination
/// </summary>
public record GetUserAppointmentsRequest(
    string? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    bool IncludePast = true,
    int PageNumber = 1,
    int PageSize = 12);