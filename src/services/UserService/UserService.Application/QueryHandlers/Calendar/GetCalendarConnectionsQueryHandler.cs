using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.Calendar;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers.Calendar;

public class GetCalendarConnectionsQueryHandler : IRequestHandler<GetCalendarConnectionsQuery, ApiResponse<List<CalendarConnectionResponse>>>
{
    private readonly IUserCalendarConnectionRepository _repository;
    private readonly ILogger<GetCalendarConnectionsQueryHandler> _logger;

    public GetCalendarConnectionsQueryHandler(
        IUserCalendarConnectionRepository repository,
        ILogger<GetCalendarConnectionsQueryHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<ApiResponse<List<CalendarConnectionResponse>>> Handle(GetCalendarConnectionsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var connections = await _repository.GetByUserIdAsync(request.UserId, cancellationToken);

            var response = connections.Select(c => new CalendarConnectionResponse
            {
                Id = c.Id,
                Provider = c.Provider,
                ProviderEmail = c.ProviderEmail,
                CalendarId = c.CalendarId,
                SyncEnabled = c.SyncEnabled,
                LastSyncAt = c.LastSyncAt,
                SyncCount = c.SyncCount,
                LastSyncError = c.LastSyncError,
                IsTokenExpired = c.IsTokenExpired(),
                CreatedAt = c.CreatedAt
            }).ToList();

            return ApiResponse<List<CalendarConnectionResponse>>.SuccessResult(response, "Calendar connections retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting calendar connections for user {UserId}", request.UserId);
            return ApiResponse<List<CalendarConnectionResponse>>.ErrorResult("Failed to retrieve calendar connections");
        }
    }
}
