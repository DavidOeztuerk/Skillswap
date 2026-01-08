using System.Text;
using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Xing;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.Xing;

/// <summary>
/// Handler for initiating Xing OAuth 1.0a connection
/// Phase 12: LinkedIn/Xing Integration
/// Note: OAuth 1.0a requires getting a request token first before redirecting to authorization
/// </summary>
public class InitiateXingConnectCommandHandler : IRequestHandler<InitiateXingConnectCommand, ApiResponse<InitiateXingConnectResponse>>
{
    private readonly IXingService _xingService;
    private readonly IUserXingConnectionRepository _repository;
    private readonly IDistributedCache _cache;
    private readonly ILogger<InitiateXingConnectCommandHandler> _logger;

    public InitiateXingConnectCommandHandler(
        IXingService xingService,
        IUserXingConnectionRepository repository,
        IDistributedCache cache,
        ILogger<InitiateXingConnectCommandHandler> logger)
    {
        _xingService = xingService;
        _repository = repository;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ApiResponse<InitiateXingConnectResponse>> Handle(
        InitiateXingConnectCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Check if user already has a Xing connection
            var existing = await _repository.GetByUserIdAsync(request.UserId, cancellationToken);
            if (existing != null)
            {
                return ApiResponse<InitiateXingConnectResponse>.ErrorResult(
                    "Xing is already connected. Disconnect first to reconnect.");
            }

            // Get request token from Xing (OAuth 1.0a step 1)
            var requestTokenResult = await _xingService.GetRequestTokenAsync(
                request.RedirectUri, cancellationToken);

            if (!requestTokenResult.Success || string.IsNullOrEmpty(requestTokenResult.OAuthToken))
            {
                _logger.LogWarning("Failed to get Xing request token for user {UserId}: {Error}",
                    request.UserId, requestTokenResult.Error);
                return ApiResponse<InitiateXingConnectResponse>.ErrorResult(
                    requestTokenResult.Error ?? "Failed to initiate Xing connection");
            }

            // Generate state token for CSRF protection
            var state = GenerateStateToken(request.UserId, requestTokenResult.OAuthToken);

            // Store request token secret in cache (needed for completing OAuth 1.0a)
            // OAuth 1.0a requires the token secret during the exchange step
            await _cache.SetStringAsync(
                $"xing_request_token:{requestTokenResult.OAuthToken}",
                requestTokenResult.OAuthTokenSecret ?? "",
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
                },
                cancellationToken);

            // Generate authorization URL
            var authUrl = _xingService.GetAuthorizationUrl(requestTokenResult.OAuthToken);

            _logger.LogInformation("Generated Xing OAuth authorization URL for user {UserId}", request.UserId);

            return ApiResponse<InitiateXingConnectResponse>.SuccessResult(
                new InitiateXingConnectResponse
                {
                    AuthorizationUrl = authUrl,
                    State = state,
                    RequestToken = requestTokenResult.OAuthToken
                },
                "Authorization URL generated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating Xing connect for user {UserId}", request.UserId);
            return ApiResponse<InitiateXingConnectResponse>.ErrorResult("Failed to initiate Xing connection");
        }
    }

    private static string GenerateStateToken(string userId, string requestToken)
    {
        var randomBytes = new byte[16];
        System.Security.Cryptography.RandomNumberGenerator.Fill(randomBytes);
        var random = Convert.ToBase64String(randomBytes);

        var stateData = $"{userId}|xing|{requestToken}|{random}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(stateData));
    }
}
