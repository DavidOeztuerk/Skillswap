using CQRS.Interfaces;

namespace AppointmentService.Application.Queries;

public record GetAppointmentStatisticsQuery(
    string UserId
) : IQuery<AppointmentStatisticsResponse>;

public record AppointmentStatisticsResponse(
    int Total,
    int Pending,
    int Accepted,
    int Confirmed,
    int Completed,
    int Cancelled,
    int Upcoming
);

