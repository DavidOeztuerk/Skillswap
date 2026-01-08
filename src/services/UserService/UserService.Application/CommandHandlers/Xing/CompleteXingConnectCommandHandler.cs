using System.Text;
using Contracts.User.Responses.Xing;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Xing;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.Xing;

/// <summary>
/// Handler for completing Xing OAuth 1.0a connection
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class CompleteXingConnectCommandHandler(
    IXingService xingService,
    IUserXingConnectionRepository repository,
    ITokenEncryptionService encryptionService,
    IDistributedCache cache,
    ILogger<CompleteXingConnectCommandHandler> logger)
    : BaseCommandHandler<CompleteXingConnectCommand, XingConnectionResponse>(logger)
{
    private readonly IXingService _xingService = xingService;
    private readonly IUserXingConnectionRepository _repository = repository;
    private readonly ITokenEncryptionService _encryptionService = encryptionService;
    private readonly IDistributedCache _cache = cache;

    public override async Task<ApiResponse<XingConnectionResponse>> Handle(
        CompleteXingConnectCommand request,
        CancellationToken cancellationToken)
    {
        // Parse and validate state token
        var (userId, requestToken, isValid) = ParseStateToken(request.State);
        if (!isValid || string.IsNullOrEmpty(userId))
        {
            return Error("Invalid state token");
        }

        // Verify request token matches
        if (requestToken != request.OAuthToken)
        {
            return Error("OAuth token mismatch");
        }

        // Check if already connected
        var existing = await _repository.GetByUserIdAsync(userId, cancellationToken);
        if (existing != null)
        {
            return Error("Xing is already connected");
        }

        // Get request token secret from cache (OAuth 1.0a)
        var requestTokenSecret = await _cache.GetStringAsync(
            $"xing_request_token:{request.OAuthToken}",
            cancellationToken);

        if (string.IsNullOrEmpty(requestTokenSecret))
        {
            return Error("Request token expired. Please try again.");
        }

        // Exchange verifier for access token
        var tokenResult = await _xingService.ExchangeVerifierForTokensAsync(
            request.OAuthToken,
            requestTokenSecret,
            request.OAuthVerifier,
            cancellationToken);

        if (!tokenResult.Success || string.IsNullOrEmpty(tokenResult.AccessToken))
        {
            Logger.LogWarning("Xing token exchange failed for user {UserId}: {Error}",
                userId, tokenResult.Error);
            return Error(tokenResult.Error ?? "Failed to exchange verifier for tokens");
        }

        // Clean up cached request token
        await _cache.RemoveAsync($"xing_request_token:{request.OAuthToken}", cancellationToken);

        // Get profile info from Xing
        var profileResult = await _xingService.GetBasicProfileAsync(
            tokenResult.AccessToken,
            tokenResult.TokenSecret ?? "",
            cancellationToken);

        // Create the Xing connection with encrypted tokens
        var connection = UserXingConnection.Create(
            userId: userId,
            xingId: tokenResult.XingId ?? "",
            accessToken: _encryptionService.Encrypt(tokenResult.AccessToken),
            tokenSecret: _encryptionService.Encrypt(tokenResult.TokenSecret ?? ""),
            profileUrl: profileResult.Profile?.Permalink,
            xingEmail: tokenResult.Email ?? profileResult.Profile?.Email
        );

        await _repository.CreateAsync(connection, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Xing connection created for user {UserId} with Xing ID {XingId}",
            userId, tokenResult.XingId);

        return Success(MapToResponse(connection), "Xing connected successfully");
    }

    private static (string? userId, string? requestToken, bool isValid) ParseStateToken(string state)
    {
        try
        {
            var stateBytes = Convert.FromBase64String(state);
            var stateData = Encoding.UTF8.GetString(stateBytes);
            var parts = stateData.Split('|');

            if (parts.Length >= 3 && parts[1] == "xing")
            {
                return (parts[0], parts[2], true);
            }

            return (null, null, false);
        }
        catch
        {
            return (null, null, false);
        }
    }

    private static XingConnectionResponse MapToResponse(UserXingConnection connection) =>
        new(
            Id: connection.Id,
            XingId: connection.XingId,
            ProfileUrl: connection.ProfileUrl,
            XingEmail: connection.XingEmail,
            IsVerified: connection.IsVerified,
            VerifiedAt: connection.VerifiedAt,
            LastSyncAt: connection.LastSyncAt,
            ImportedExperienceCount: connection.ImportedExperienceCount,
            ImportedEducationCount: connection.ImportedEducationCount,
            AutoSyncEnabled: connection.AutoSyncEnabled,
            CreatedAt: connection.CreatedAt
        );
}
