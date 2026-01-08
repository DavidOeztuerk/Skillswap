using System.Text;
using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.LinkedIn;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.LinkedIn;

/// <summary>
/// Handler for initiating LinkedIn OAuth 2.0 connection
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class InitiateLinkedInConnectCommandHandler : IRequestHandler<InitiateLinkedInConnectCommand, ApiResponse<InitiateLinkedInConnectResponse>>
{
    private readonly ILinkedInService _linkedInService;
    private readonly IUserLinkedInConnectionRepository _repository;
    private readonly ILogger<InitiateLinkedInConnectCommandHandler> _logger;

    public InitiateLinkedInConnectCommandHandler(
        ILinkedInService linkedInService,
        IUserLinkedInConnectionRepository repository,
        ILogger<InitiateLinkedInConnectCommandHandler> logger)
    {
        _linkedInService = linkedInService;
        _repository = repository;
        _logger = logger;
    }

    public async Task<ApiResponse<InitiateLinkedInConnectResponse>> Handle(
        InitiateLinkedInConnectCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Check if user already has a LinkedIn connection
            var existing = await _repository.GetByUserIdAsync(request.UserId, cancellationToken);
            if (existing != null)
            {
                return ApiResponse<InitiateLinkedInConnectResponse>.ErrorResult(
                    "LinkedIn is already connected. Disconnect first to reconnect.");
            }

            // Generate state token for CSRF protection
            var state = GenerateStateToken(request.UserId);

            // Generate authorization URL
            var authUrl = _linkedInService.GetAuthorizationUrl(state, request.RedirectUri);

            _logger.LogInformation("Generated LinkedIn OAuth authorization URL for user {UserId}", request.UserId);

            return ApiResponse<InitiateLinkedInConnectResponse>.SuccessResult(
                new InitiateLinkedInConnectResponse
                {
                    AuthorizationUrl = authUrl,
                    State = state
                },
                "Authorization URL generated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating LinkedIn connect for user {UserId}", request.UserId);
            return ApiResponse<InitiateLinkedInConnectResponse>.ErrorResult("Failed to initiate LinkedIn connection");
        }
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
