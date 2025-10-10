using System.IdentityModel.Tokens.Jwt;
using Contracts.User.Responses.Auth;
using CQRS.Handlers;
using CQRS.Models;
using Infrastructure.Security;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers;

public class LogoutUserCommandHandler(
    IAuthRepository authRepository,
    ITokenRevocationService tokenRevocationService,
    ILogger<LogoutUserCommandHandler> logger)
    : BaseCommandHandler<LogoutUserCommand, LogoutResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;
    private readonly ITokenRevocationService _tokenRevocationService = tokenRevocationService;

    public override async Task<ApiResponse<LogoutResponse>> Handle(LogoutUserCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            throw new InvalidOperationException("User ID is required");
        }

        var jti = ExtractJtiFromToken(request.AccessToken);
        if (!string.IsNullOrEmpty(jti))
        {
            var ttl = ExtractTimeToLiveFromToken(request.AccessToken);
            await _tokenRevocationService.RevokeTokenAsync(jti, ttl, cancellationToken);
            Logger.LogInformation("Access token revoked for user {UserId}, JTI: {Jti}", request.UserId, jti);
        }

        await _authRepository.RevokeAllRefreshTokensAsync(request.UserId, cancellationToken);
        Logger.LogInformation("All refresh tokens revoked for user {UserId}", request.UserId);

        var result = new LogoutResponse(true, "Logged out successfully");
        return Success(result, "Logged out successfully");
    }

    private string? ExtractJtiFromToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            return jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
        }
        catch
        {
            return null;
        }
    }

    private TimeSpan? ExtractTimeToLiveFromToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            var ttl = jwtToken.ValidTo - DateTime.UtcNow;
            return ttl.TotalSeconds > 0 ? ttl : TimeSpan.FromHours(1);
        }
        catch
        {
            return TimeSpan.FromHours(1);
        }
    }
}
