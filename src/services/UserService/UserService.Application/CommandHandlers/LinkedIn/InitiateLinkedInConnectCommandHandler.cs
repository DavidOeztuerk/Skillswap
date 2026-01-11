using System.Text;
using Contracts.User.Responses.LinkedIn;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.LinkedIn;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.LinkedIn;

/// <summary>
/// Handler for initiating LinkedIn OAuth 2.0 connection
/// </summary>
public class InitiateLinkedInConnectCommandHandler(
    ILinkedInService linkedInService,
    IUserLinkedInConnectionRepository repository,
    ILogger<InitiateLinkedInConnectCommandHandler> logger)
    : BaseCommandHandler<InitiateLinkedInConnectCommand, InitiateLinkedInConnectResponse>(logger)
{
  private readonly ILinkedInService _linkedInService = linkedInService;
  private readonly IUserLinkedInConnectionRepository _repository = repository;

  public override async Task<ApiResponse<InitiateLinkedInConnectResponse>> Handle(
      InitiateLinkedInConnectCommand request,
      CancellationToken cancellationToken)
  {
    // Check if user already has a LinkedIn connection
    var existing = await _repository.GetByUserIdAsync(request.UserId!, cancellationToken);
    if (existing != null)
    {
      return Error("LinkedIn is already connected. Disconnect first to reconnect.");
    }

    // Generate state token for CSRF protection
    var state = GenerateStateToken(request.UserId!);

    // Generate authorization URL
    var authUrl = _linkedInService.GetAuthorizationUrl(state, request.RedirectUri);

    Logger.LogInformation("Generated LinkedIn OAuth authorization URL for user {UserId}", request.UserId);

    return Success(
        new InitiateLinkedInConnectResponse(authUrl, state),
        "Authorization URL generated successfully");
  }

  private static string GenerateStateToken(string userId)
  {
    var randomBytes = new byte[16];
    System.Security.Cryptography.RandomNumberGenerator.Fill(randomBytes);
    var random = Convert.ToBase64String(randomBytes);

    var stateData = $"{userId}|linkedin|{random}";
    return Convert.ToBase64String(Encoding.UTF8.GetBytes(stateData));
  }
}
