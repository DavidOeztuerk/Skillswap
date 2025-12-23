using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Calendar;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.Calendar;

public class DisconnectCalendarCommandHandler : IRequestHandler<DisconnectCalendarCommand, ApiResponse<bool>>
{
    private readonly ICalendarServiceFactory _calendarServiceFactory;
    private readonly IUserCalendarConnectionRepository _repository;
    private readonly ITokenEncryptionService _encryptionService;
    private readonly ILogger<DisconnectCalendarCommandHandler> _logger;

    public DisconnectCalendarCommandHandler(
        ICalendarServiceFactory calendarServiceFactory,
        IUserCalendarConnectionRepository repository,
        ITokenEncryptionService encryptionService,
        ILogger<DisconnectCalendarCommandHandler> logger)
    {
        _calendarServiceFactory = calendarServiceFactory;
        _repository = repository;
        _encryptionService = encryptionService;
        _logger = logger;
    }

    public async Task<ApiResponse<bool>> Handle(DisconnectCalendarCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate provider
            if (!CalendarProviders.IsValid(request.Provider))
            {
                return ApiResponse<bool>.ErrorResult(
                    $"Invalid calendar provider. Supported providers: {string.Join(", ", CalendarProviders.All)}");
            }

            // Find the connection
            var connection = await _repository.GetByUserAndProviderAsync(request.UserId, request.Provider, cancellationToken);
            if (connection == null)
            {
                return ApiResponse<bool>.ErrorResult($"No connection found for provider {request.Provider}");
            }

            // Try to revoke access with the provider (best effort)
            try
            {
                var calendarService = _calendarServiceFactory.GetService(request.Provider);
                var accessToken = _encryptionService.Decrypt(connection.AccessToken);
                await calendarService.RevokeAccessAsync(accessToken, cancellationToken);
            }
            catch (Exception ex)
            {
                // Log but don't fail - we still want to remove our connection
                _logger.LogWarning(ex, "Failed to revoke access with provider {Provider} for user {UserId}",
                    request.Provider, request.UserId);
            }

            // Delete the connection
            await _repository.DeleteAsync(connection, cancellationToken);

            _logger.LogInformation("Calendar disconnected for user {UserId} with provider {Provider}",
                request.UserId, request.Provider);

            return ApiResponse<bool>.SuccessResult(true, "Calendar disconnected successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting calendar for user {UserId} with provider {Provider}",
                request.UserId, request.Provider);
            return ApiResponse<bool>.ErrorResult("Failed to disconnect calendar");
        }
    }
}
