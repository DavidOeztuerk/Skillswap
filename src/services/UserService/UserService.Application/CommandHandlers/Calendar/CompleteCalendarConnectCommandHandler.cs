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

public class CompleteCalendarConnectCommandHandler : IRequestHandler<CompleteCalendarConnectCommand, ApiResponse<CalendarConnectionResponse>>
{
    private readonly ICalendarServiceFactory _calendarServiceFactory;
    private readonly IUserCalendarConnectionRepository _repository;
    private readonly ITokenEncryptionService _encryptionService;
    private readonly ILogger<CompleteCalendarConnectCommandHandler> _logger;

    public CompleteCalendarConnectCommandHandler(
        ICalendarServiceFactory calendarServiceFactory,
        IUserCalendarConnectionRepository repository,
        ITokenEncryptionService encryptionService,
        ILogger<CompleteCalendarConnectCommandHandler> logger)
    {
        _calendarServiceFactory = calendarServiceFactory;
        _repository = repository;
        _encryptionService = encryptionService;
        _logger = logger;
    }

    public async Task<ApiResponse<CalendarConnectionResponse>> Handle(CompleteCalendarConnectCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Decode and parse state token
            var (userId, provider, isValid) = ParseStateToken(request.State);
            if (!isValid || string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(provider))
            {
                return ApiResponse<CalendarConnectionResponse>.ErrorResult("Invalid state token");
            }

            // Validate provider
            if (!CalendarProviders.IsValid(provider))
            {
                return ApiResponse<CalendarConnectionResponse>.ErrorResult($"Invalid calendar provider: {provider}");
            }

            // Check if already connected
            var existing = await _repository.GetByUserAndProviderAsync(userId, provider, cancellationToken);
            if (existing != null)
            {
                return ApiResponse<CalendarConnectionResponse>.ErrorResult(
                    $"Calendar provider {provider} is already connected");
            }

            // Exchange code for tokens
            var calendarService = _calendarServiceFactory.GetService(provider);
            var tokenResult = await calendarService.ExchangeCodeForTokensAsync(request.Code, request.RedirectUri, cancellationToken);

            if (!tokenResult.Success || string.IsNullOrEmpty(tokenResult.AccessToken))
            {
                _logger.LogWarning("OAuth token exchange failed for user {UserId} with provider {Provider}: {Error}",
                    userId, provider, tokenResult.Error);
                return ApiResponse<CalendarConnectionResponse>.ErrorResult(
                    tokenResult.Error ?? "Failed to exchange authorization code for tokens");
            }

            // Create the calendar connection with encrypted tokens
            var connection = new UserCalendarConnection
            {
                UserId = userId,
                Provider = provider,
                AccessToken = _encryptionService.Encrypt(tokenResult.AccessToken),
                RefreshToken = _encryptionService.Encrypt(tokenResult.RefreshToken ?? ""),
                TokenExpiresAt = tokenResult.ExpiresAt,
                ProviderEmail = tokenResult.Email,
                CalendarId = "primary", // Default calendar
                SyncEnabled = true
            };

            await _repository.CreateAsync(connection, cancellationToken);

            _logger.LogInformation("Calendar connection created for user {UserId} with provider {Provider}",
                userId, provider);

            var response = new CalendarConnectionResponse
            {
                Id = connection.Id,
                Provider = connection.Provider,
                ProviderEmail = connection.ProviderEmail,
                CalendarId = connection.CalendarId,
                SyncEnabled = connection.SyncEnabled,
                LastSyncAt = connection.LastSyncAt,
                SyncCount = connection.SyncCount,
                LastSyncError = connection.LastSyncError,
                IsTokenExpired = connection.IsTokenExpired(),
                CreatedAt = connection.CreatedAt
            };

            return ApiResponse<CalendarConnectionResponse>.SuccessResult(response, "Calendar connected successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing calendar connection");
            return ApiResponse<CalendarConnectionResponse>.ErrorResult("Failed to complete calendar connection");
        }
    }

    private static (string? userId, string? provider, bool isValid) ParseStateToken(string state)
    {
        try
        {
            var stateBytes = Convert.FromBase64String(state);
            var stateData = Encoding.UTF8.GetString(stateBytes);
            var parts = stateData.Split('|');

            if (parts.Length >= 2)
            {
                return (parts[0], parts[1], true);
            }

            return (null, null, false);
        }
        catch
        {
            return (null, null, false);
        }
    }
}
