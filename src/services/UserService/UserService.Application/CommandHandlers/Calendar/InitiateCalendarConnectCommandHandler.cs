using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Calendar;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.Calendar;

public class InitiateCalendarConnectCommandHandler : IRequestHandler<InitiateCalendarConnectCommand, ApiResponse<InitiateCalendarConnectResponse>>
{
    private readonly ICalendarServiceFactory _calendarServiceFactory;
    private readonly IUserCalendarConnectionRepository _repository;
    private readonly ILogger<InitiateCalendarConnectCommandHandler> _logger;

    public InitiateCalendarConnectCommandHandler(
        ICalendarServiceFactory calendarServiceFactory,
        IUserCalendarConnectionRepository repository,
        ILogger<InitiateCalendarConnectCommandHandler> logger)
    {
        _calendarServiceFactory = calendarServiceFactory;
        _repository = repository;
        _logger = logger;
    }

    public async Task<ApiResponse<InitiateCalendarConnectResponse>> Handle(InitiateCalendarConnectCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate provider
            if (!CalendarProviders.IsValid(request.Provider))
            {
                return ApiResponse<InitiateCalendarConnectResponse>.ErrorResult(
                    $"Invalid calendar provider. Supported providers: {string.Join(", ", CalendarProviders.All)}");
            }

            // Check if user already has this provider connected
            var existing = await _repository.GetByUserAndProviderAsync(request.UserId, request.Provider, cancellationToken);
            if (existing != null)
            {
                return ApiResponse<InitiateCalendarConnectResponse>.ErrorResult(
                    $"Calendar provider {request.Provider} is already connected. Disconnect first to reconnect.");
            }

            // Generate state token for CSRF protection (includes user ID and provider)
            var state = GenerateStateToken(request.UserId, request.Provider);

            // Get the calendar service and generate auth URL
            var calendarService = _calendarServiceFactory.GetService(request.Provider);
            var authUrl = calendarService.GetAuthorizationUrl(state, request.RedirectUri);

            _logger.LogInformation("Generated OAuth authorization URL for user {UserId} with provider {Provider}",
                request.UserId, request.Provider);

            return ApiResponse<InitiateCalendarConnectResponse>.SuccessResult(
                new InitiateCalendarConnectResponse
                {
                    AuthorizationUrl = authUrl,
                    State = state
                },
                "Authorization URL generated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating calendar connect for user {UserId} with provider {Provider}",
                request.UserId, request.Provider);
            return ApiResponse<InitiateCalendarConnectResponse>.ErrorResult("Failed to initiate calendar connection");
        }
    }

    private static string GenerateStateToken(string userId, string provider)
    {
        // State includes userId, provider, and random component for CSRF protection
        var randomBytes = new byte[16];
        System.Security.Cryptography.RandomNumberGenerator.Fill(randomBytes);
        var random = Convert.ToBase64String(randomBytes);

        // Base64 encode the state for URL safety
        var stateData = $"{userId}|{provider}|{random}";
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(stateData));
    }
}
