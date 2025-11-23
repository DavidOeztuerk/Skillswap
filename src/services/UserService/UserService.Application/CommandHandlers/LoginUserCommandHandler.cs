using CQRS.Handlers;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using Contracts.User.Responses.Auth;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using System.Collections.Concurrent;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers;

public class LoginUserCommandHandler(
    IAuthRepository authRepository,
    ILogger<LoginUserCommandHandler> logger)
    : BaseCommandHandler<LoginUserCommand, LoginResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;

    // In-memory rate limiting storage
    // Key: email, Value: (attempt count, window reset time)
    private static readonly ConcurrentDictionary<string, LoginAttemptData> _loginAttempts = new();

    // Rate limiting configuration
    private const int MaxAttemptsPerWindow = 5;
    private static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(15);

    public override async Task<ApiResponse<LoginResponse>> Handle(
        LoginUserCommand request,
        CancellationToken cancellationToken)
    {
        // Rate limiting check
        var rateLimitKey = request.Email.ToLowerInvariant();
        var now = DateTime.UtcNow;

        // Get or create attempt data
        var attemptData = _loginAttempts.GetOrAdd(rateLimitKey, _ => new LoginAttemptData
        {
            Attempts = 0,
            WindowResetTime = now.Add(RateLimitWindow)
        });

        // Check if window has expired
        if (now >= attemptData.WindowResetTime)
        {
            // Reset the window
            attemptData = new LoginAttemptData
            {
                Attempts = 1,
                WindowResetTime = now.Add(RateLimitWindow)
            };
            _loginAttempts[rateLimitKey] = attemptData;
        }
        else
        {
            // Check if max attempts exceeded
            if (attemptData.Attempts >= MaxAttemptsPerWindow)
            {
                var remainingTime = attemptData.WindowResetTime - now;
                Logger.LogWarning(
                    "Rate limit exceeded for email {Email}. Attempts: {Attempts}. Reset in: {RemainingMinutes} minutes",
                    request.Email,
                    attemptData.Attempts,
                    Math.Ceiling(remainingTime.TotalMinutes));

                return Error(
                    $"Too many login attempts. Please try again in {Math.Ceiling(remainingTime.TotalMinutes)} minutes.",
                    ErrorCodes.RateLimitExceeded);
            }

            // Increment attempt count
            attemptData.Attempts++;
            _loginAttempts[rateLimitKey] = attemptData;
        }

        try
        {
            // Let exceptions bubble up to GlobalExceptionHandler
            // Only catch specific exceptions that we want to handle differently

            var result = await _authRepository.LoginUser(
                request.Email,
                request.Password,
                request.TwoFactorCode,
                request.DeviceId,
                request.DeviceInfo,
                cancellationToken);

            // Success - reset the rate limit for this user
            _loginAttempts.TryRemove(rateLimitKey, out _);

            Logger.LogInformation("User {Email} logged in successfully", request.Email);
            return Success(result, "Login successful");
        }
        catch (Exception)
        {
            // Failed login - keep the rate limit counter
            Logger.LogWarning(
                "Failed login attempt for {Email}. Total attempts in window: {Attempts}/{Max}",
                request.Email,
                attemptData.Attempts,
                MaxAttemptsPerWindow);
            throw;
        }
    }

    // Cleanup old entries periodically (called by a background service or manually)
    public static void CleanupExpiredEntries()
    {
        var now = DateTime.UtcNow;
        var expiredKeys = _loginAttempts
            .Where(kvp => now >= kvp.Value.WindowResetTime)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var key in expiredKeys)
        {
            _loginAttempts.TryRemove(key, out _);
        }
    }

    private class LoginAttemptData
    {
        public int Attempts { get; set; }
        public DateTime WindowResetTime { get; set; }
    }
}
