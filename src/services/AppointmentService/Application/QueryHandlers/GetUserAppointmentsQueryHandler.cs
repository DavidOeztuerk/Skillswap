using AppointmentService.Application.Queries;
using AppointmentService.Domain.Entities;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.QueryHandlers;

public class GetUserAppointmentsQueryHandler(
    AppointmentDbContext dbContext,
    ILogger<GetUserAppointmentsQueryHandler> logger)
    : BasePagedQueryHandler<GetUserAppointmentsQuery, UserAppointmentResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;

    public override async Task<PagedResponse<UserAppointmentResponse>> Handle(
        GetUserAppointmentsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Retrieving appointments for user {UserId} with parameters: {@Query}", request.UserId, request);

            // Filter by user - appointments where user is either organizer or participant
            var query = _dbContext.Appointments
                .AsNoTracking() // Performance: Read-only query
                .Where(a => a.OrganizerUserId == request.UserId || a.ParticipantUserId == request.UserId)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(a => a.Status == request.Status);
            }

            if (request.FromDate.HasValue)
            {
                query = query.Where(a => a.ScheduledDate >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                query = query.Where(a => a.ScheduledDate <= request.ToDate.Value);
            }

            if (!request.IncludePast)
            {
                query = query.Where(a => a.ScheduledDate >= DateTime.UtcNow || a.Status != AppointmentStatus.Completed);
            }

            // Order by scheduled date
            query = query.OrderBy(a => a.ScheduledDate);

            // Get total count
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply pagination
            var appointments = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(a => new UserAppointmentResponse(
                    a.Id,
                    a.Title,
                    a.ScheduledDate,
                    a.DurationMinutes,
                    a.Status,
                    a.OrganizerUserId == request.UserId ? a.ParticipantUserId : a.OrganizerUserId,
                    "Other Party Name", // TODO: This would come from user service
                    a.MeetingType ?? "VideoCall",
                    a.OrganizerUserId == request.UserId
                ))
                .ToListAsync(cancellationToken);

            return Success(appointments, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving user appointments");
            return Error("An error occurred while retrieving appointments");
        }
    }
}
