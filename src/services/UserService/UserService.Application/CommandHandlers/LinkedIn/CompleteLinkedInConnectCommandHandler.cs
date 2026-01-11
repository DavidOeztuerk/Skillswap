using System.Text;
using Contracts.User.Responses.LinkedIn;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.LinkedIn;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.LinkedIn;

/// <summary>
/// Handler for completing LinkedIn OAuth 2.0 connection
/// </summary>
public class CompleteLinkedInConnectCommandHandler(
    ILinkedInService linkedInService,
    IUserLinkedInConnectionRepository repository,
    ITokenEncryptionService encryptionService,
    ILogger<CompleteLinkedInConnectCommandHandler> logger)
    : BaseCommandHandler<CompleteLinkedInConnectCommand, LinkedInConnectionResponse>(logger)
{
  private readonly ILinkedInService _linkedInService = linkedInService;
  private readonly IUserLinkedInConnectionRepository _repository = repository;
  private readonly ITokenEncryptionService _encryptionService = encryptionService;

  public override async Task<ApiResponse<LinkedInConnectionResponse>> Handle(
      CompleteLinkedInConnectCommand request,
      CancellationToken cancellationToken)
  {
    // Parse and validate state token
    var (userId, isValid) = ParseStateToken(request.State);
    if (!isValid || string.IsNullOrEmpty(userId))
    {
      return Error("Invalid state token");
    }

    // Check if already connected
    var existing = await _repository.GetByUserIdAsync(userId, cancellationToken);
    if (existing != null)
    {
      return Error("LinkedIn is already connected");
    }

    // Exchange code for tokens
    var tokenResult = await _linkedInService.ExchangeCodeForTokensAsync(
        request.Code, request.RedirectUri, cancellationToken);

    if (!tokenResult.Success || string.IsNullOrEmpty(tokenResult.AccessToken))
    {
      Logger.LogWarning("LinkedIn token exchange failed for user {UserId}: {Error}",
          userId, tokenResult.Error);
      return Error(tokenResult.Error ?? "Failed to exchange authorization code for tokens");
    }

    // Get profile URL from LinkedIn
    var profileResult = await _linkedInService.GetBasicProfileAsync(
        tokenResult.AccessToken, cancellationToken);

    // Create the LinkedIn connection with encrypted tokens
    var connection = UserLinkedInConnection.Create(
        userId: userId,
        linkedInId: tokenResult.LinkedInId ?? "",
        accessToken: _encryptionService.Encrypt(tokenResult.AccessToken),
        refreshToken: tokenResult.RefreshToken != null ? _encryptionService.Encrypt(tokenResult.RefreshToken) : null,
        tokenExpiresAt: tokenResult.ExpiresAt,
        profileUrl: profileResult.Profile?.ProfileUrl,
        linkedInEmail: tokenResult.Email ?? profileResult.Profile?.Email
    );

    await _repository.CreateAsync(connection, cancellationToken);
    await _repository.SaveChangesAsync(cancellationToken);

    Logger.LogInformation("LinkedIn connection created for user {UserId} with LinkedIn ID {LinkedInId}",
        userId, tokenResult.LinkedInId);

    return Success(MapToResponse(connection), "LinkedIn connected successfully");
  }

  private static (string? userId, bool isValid) ParseStateToken(string state)
  {
    try
    {
      var stateBytes = Convert.FromBase64String(state);
      var stateData = Encoding.UTF8.GetString(stateBytes);
      var parts = stateData.Split('|');

      if (parts.Length >= 2 && parts[1] == "linkedin")
      {
        return (parts[0], true);
      }

      return (null, false);
    }
    catch
    {
      return (null, false);
    }
  }

  private static LinkedInConnectionResponse MapToResponse(UserLinkedInConnection connection) =>
      new(
          Id: connection.Id,
          LinkedInId: connection.LinkedInId,
          ProfileUrl: connection.ProfileUrl,
          LinkedInEmail: connection.LinkedInEmail,
          IsVerified: connection.IsVerified,
          VerifiedAt: connection.VerifiedAt,
          LastSyncAt: connection.LastSyncAt,
          ImportedExperienceCount: connection.ImportedExperienceCount,
          ImportedEducationCount: connection.ImportedEducationCount,
          AutoSyncEnabled: connection.AutoSyncEnabled,
          CreatedAt: connection.CreatedAt
      );
}
