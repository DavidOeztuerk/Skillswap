using AppointmentService.Application.Queries;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.QueryHandlers;

public class GetAppointmentStatisticsQueryHandler(
    IAppointmentUnitOfWork unitOfWork,
    ILogger<GetAppointmentStatisticsQueryHandler> logger)
    : BaseQueryHandler<GetAppointmentStatisticsQuery, AppointmentStatisticsResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<AppointmentStatisticsResponse>> Handle(
        GetAppointmentStatisticsQuery request,
        CancellationToken cancellationToken)
    {
        var (total, completed, cancelled) = await _unitOfWork.SessionAppointments.GetAppointmentStatisticsAsync(request.UserId, cancellationToken);

        var response = new AppointmentStatisticsResponse(
            Total: total,
            Pending: 0,
            Accepted: 0,
            Confirmed: 0,
            Completed: completed,
            Cancelled: cancelled,
            Upcoming: 0
        );

        return Success(response);
    }
}
