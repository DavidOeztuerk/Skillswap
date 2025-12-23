using System.Text;
using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Calendar;
using UserService.Application.Queries.Calendar;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.Calendar;

public class ConnectAppleCalendarCommandHandler : IRequestHandler<ConnectAppleCalendarCommand, ApiResponse<CalendarConnectionResponse>>
{
    private readonly ICalendarServiceFactory _calendarServiceFactory;
    private readonly IUserCalendarConnectionRepository _repository;
    private readonly ITokenEncryptionService _encryptionService;
    private readonly ILogger<ConnectAppleCalendarCommandHandler> _logger;

    public ConnectAppleCalendarCommandHandler(
        ICalendarServiceFactory calendarServiceFactory,
        IUserCalendarConnectionRepository repository,
        ITokenEncryptionService encryptionService,
        ILogger<ConnectAppleCalendarCommandHandler> logger)
    {
        _calendarServiceFactory = calendarServiceFactory;
        _repository = repository;
        _encryptionService = encryptionService;
        _logger = logger;
    }

    public async Task<ApiResponse<CalendarConnectionResponse>> Handle(ConnectAppleCalendarCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Connecting Apple Calendar for user {UserId}", request.UserId);

            // Check if user already has Apple connected
            var existing = await _repository.GetByUserAndProviderAsync(request.UserId, CalendarProviders.Apple, cancellationToken);
            if (existing != null)
            {
                return ApiResponse<CalendarConnectionResponse>.ErrorResult(
                    "Apple Calendar is already connected. Disconnect first to reconnect.");
            }

            // Decode credentials from base64
            string decodedCredentials;
            try
            {
                decodedCredentials = Encoding.UTF8.GetString(Convert.FromBase64String(request.Credentials));
            }
            catch
            {
                return ApiResponse<CalendarConnectionResponse>.ErrorResult("Invalid credentials format");
            }

            // Get Apple calendar service and exchange credentials
            var calendarService = _calendarServiceFactory.GetService(CalendarProviders.Apple);
            var tokenResult = await calendarService.ExchangeCodeForTokensAsync(decodedCredentials, "", cancellationToken);

            if (!tokenResult.Success || string.IsNullOrEmpty(tokenResult.AccessToken))
            {
                _logger.LogWarning("Apple Calendar authentication failed for user {UserId}: {Error}",
                    request.UserId, tokenResult.Error);
                return ApiResponse<CalendarConnectionResponse>.ErrorResult(
                    tokenResult.Error ?? "Apple Calendar authentication failed");
            }

            // Create connection record
            var connection = new UserCalendarConnection
            {
                Id = Guid.NewGuid().ToString(),
                UserId = request.UserId,
                Provider = CalendarProviders.Apple,
                ProviderEmail = tokenResult.Email,
                AccessToken = _encryptionService.Encrypt(tokenResult.AccessToken),
                RefreshToken = string.Empty, // Apple CalDAV doesn't use refresh tokens
                TokenExpiresAt = tokenResult.ExpiresAt,
                SyncEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.CreateAsync(connection, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Successfully connected Apple Calendar for user {UserId} ({Email})",
                request.UserId, tokenResult.Email);

            return ApiResponse<CalendarConnectionResponse>.SuccessResult(
                new CalendarConnectionResponse
                {
                    Id = connection.Id,
                    Provider = connection.Provider,
                    ProviderEmail = connection.ProviderEmail,
                    CalendarId = connection.CalendarId,
                    SyncEnabled = connection.SyncEnabled,
                    LastSyncAt = connection.LastSyncAt,
                    SyncCount = connection.SyncCount,
                    LastSyncError = connection.LastSyncError,
                    IsTokenExpired = false,
                    CreatedAt = connection.CreatedAt
                },
                "Apple Calendar connected successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error connecting Apple Calendar for user {UserId}", request.UserId);
            return ApiResponse<CalendarConnectionResponse>.ErrorResult("Failed to connect Apple Calendar");
        }
    }
}
