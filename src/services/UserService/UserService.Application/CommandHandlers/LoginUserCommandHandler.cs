using CQRS.Handlers;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using Contracts.User.Responses.Auth;
using Microsoft.Extensions.Logging;
using CQRS.Models;

namespace UserService.Application.CommandHandlers;

/// <summary>
/// Handles user login requests.
///
/// RATE LIMITING:
/// Rate limiting is now handled at the Gateway level using Distributed Rate Limiting with Redis.
/// This ensures rate limits are enforced across all service instances.
/// Configuration: Gateway/appsettings.json -> DistributedRateLimiting:EndpointSpecificLimits["/api/auth/login"]
/// Default limits: 5 req/min, 20 req/hour, 100 req/day per IP/User
/// </summary>
public class LoginUserCommandHandler(
    IAuthRepository authRepository,
    ILogger<LoginUserCommandHandler> logger)
    : BaseCommandHandler<LoginUserCommand, LoginResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;

    public override async Task<ApiResponse<LoginResponse>> Handle(
        LoginUserCommand request,
        CancellationToken cancellationToken)
    {
        // NOTE: Rate limiting is handled by DistributedRateLimitingMiddleware in the Gateway.
        // The middleware enforces:
        // - IP-based rate limiting (prevents brute force from same IP)
        // - User-based rate limiting (prevents credential stuffing)
        // - Sliding window algorithm for accurate rate limiting across distributed instances
        // - Redis-backed storage for consistent limits across all service instances

        Logger.LogDebug("Processing login request for email: {Email}", request.Email);

        var result = await _authRepository.LoginUser(
            request.Email,
            request.Password,
            request.TwoFactorCode,
            request.DeviceId,
            request.DeviceInfo,
            request.DeviceFingerprint,
            request.Browser,
            request.OperatingSystem,
            request.ScreenResolution,
            request.TimeZone,
            request.Language,
            request.IpAddress,
            cancellationToken);

        Logger.LogInformation("User {Email} logged in successfully", request.Email);
        return Success(result, "Login successful");
    }
}
