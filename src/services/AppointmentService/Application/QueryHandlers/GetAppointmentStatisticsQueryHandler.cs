using AppointmentService.Application.Queries;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;
using AppointmentService.Domain.Entities;

namespace AppointmentService.Application.QueryHandlers;

public class GetAppointmentStatisticsQueryHandler(
    AppointmentDbContext dbContext,
    ILogger<GetAppointmentStatisticsQueryHandler> logger)
    : BaseQueryHandler<GetAppointmentStatisticsQuery, AppointmentStatisticsResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<AppointmentStatisticsResponse>> Handle(
        GetAppointmentStatisticsQuery request,
        CancellationToken cancellationToken)
    {
        var baseQuery = _dbContext.Appointments
            .AsNoTracking()
            .Where(a => a.OrganizerUserId == request.UserId || a.ParticipantUserId == request.UserId);

        var total = await baseQuery.CountAsync(cancellationToken);
        var pending = await baseQuery.CountAsync(a => a.Status == AppointmentStatus.Pending, cancellationToken);
        var accepted = await baseQuery.CountAsync(a => a.Status == AppointmentStatus.Accepted, cancellationToken);
        var confirmed = await baseQuery.CountAsync(a => a.Status == AppointmentStatus.Accepted, cancellationToken);
        var completed = await baseQuery.CountAsync(a => a.Status == AppointmentStatus.Completed, cancellationToken);
        var cancelled = await baseQuery.CountAsync(a => a.Status == AppointmentStatus.Cancelled, cancellationToken);
        var upcoming = await baseQuery.CountAsync(a => a.ScheduledDate > DateTime.UtcNow && (a.Status == AppointmentStatus.Accepted), cancellationToken);

        var resp = new AppointmentStatisticsResponse(total, pending, accepted, confirmed, completed, cancelled, upcoming);
        return Success(resp);
    }
}
