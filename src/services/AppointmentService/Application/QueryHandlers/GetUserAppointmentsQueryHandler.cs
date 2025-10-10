using AppointmentService.Application.Queries;
using AppointmentService.Domain.Entities;
using AppointmentService.Infrastructure.HttpClients;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.QueryHandlers;

public class GetUserAppointmentsQueryHandler(
    AppointmentDbContext dbContext,
    IUserServiceClient userServiceClient,
    ILogger<GetUserAppointmentsQueryHandler> logger)
    : BasePagedQueryHandler<GetUserAppointmentsQuery, UserAppointmentResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

    public override async Task<PagedResponse<UserAppointmentResponse>> Handle(
        GetUserAppointmentsQuery request,
        CancellationToken cancellationToken)
    {
        {
            Logger.LogInformation("Retrieving appointments for user {UserId} with parameters: {@Query}", request.UserId, request);

            // Filter by user - appointments where user is either organizer or participant
            var query = _dbContext.Appointments
                .AsNoTracking() 
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

            // Apply pagination and get appointments
            var appointmentEntities = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            // Fetch user names for other parties
            var appointments = new List<UserAppointmentResponse>();
            foreach (var a in appointmentEntities)
            {
                var otherPartyUserId = a.OrganizerUserId == request.UserId ? a.ParticipantUserId : a.OrganizerUserId;
                var otherPartyName = await _userServiceClient.GetUserNameAsync(otherPartyUserId, cancellationToken);

                appointments.Add(new UserAppointmentResponse(
                    a.Id,
                    a.Title,
                    a.ScheduledDate,
                    a.DurationMinutes,
                    a.Status,
                    otherPartyUserId,
                    otherPartyName,
                    a.MeetingType ?? "VideoCall",
                    a.OrganizerUserId == request.UserId
                ));
            }

            return Success(appointments, request.PageNumber, request.PageSize, totalCount);
        }
    }
}
