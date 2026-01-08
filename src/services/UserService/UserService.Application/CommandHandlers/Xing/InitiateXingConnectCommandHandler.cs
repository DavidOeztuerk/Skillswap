using System.Text;
using Contracts.User.Responses.Xing;
using CQRS.Handlers;
using CQRS.Models;
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
public class InitiateXingConnectCommandHandler(
    IXingService xingService,
    IUserXingConnectionRepository repository,
    IDistributedCache cache,
    ILogger<InitiateXingConnectCommandHandler> logger)
    : BaseCommandHandler<InitiateXingConnectCommand, InitiateXingConnectResponse>(logger)
{
    private readonly IXingService _xingService = xingService;
    private readonly IUserXingConnectionRepository _repository = repository;
    private readonly IDistributedCache _cache = cache;

    public override async Task<ApiResponse<InitiateXingConnectResponse>> Handle(
        InitiateXingConnectCommand request,
        CancellationToken cancellationToken)
    {
        // Check if user already has a Xing connection
        var existing = await _repository.GetByUserIdAsync(request.UserId!, cancellationToken);
        if (existing != null)
        {
            return Error("Xing is already connected. Disconnect first to reconnect.");
        }

        // Get request token from Xing (OAuth 1.0a step 1)
        var requestTokenResult = await _xingService.GetRequestTokenAsync(
            request.RedirectUri, cancellationToken);

        if (!requestTokenResult.Success || string.IsNullOrEmpty(requestTokenResult.OAuthToken))
        {
            Logger.LogWarning("Failed to get Xing request token for user {UserId}: {Error}",
                request.UserId, requestTokenResult.Error);
            return Error(requestTokenResult.Error ?? "Failed to initiate Xing connection");
        }

        // Generate state token for CSRF protection
        var state = GenerateStateToken(request.UserId!, requestTokenResult.OAuthToken);

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

        Logger.LogInformation("Generated Xing OAuth authorization URL for user {UserId}", request.UserId);

        return Success(
            new InitiateXingConnectResponse(authUrl, state, requestTokenResult.OAuthToken),
            "Authorization URL generated successfully");
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
