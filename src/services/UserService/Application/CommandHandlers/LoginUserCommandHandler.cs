using CQRS.Handlers;
using Infrastructure.Models;
using Infrastructure.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;
using UserService.Domain.Events;
using UserService.Domain.Models;

namespace UserService.Application.CommandHandlers;

// ============================================================================
// LOGIN USER COMMAND HANDLER
// ============================================================================

public class LoginUserCommandHandler(
    UserDbContext dbContext,
    IEnhancedJwtService jwtService,
    ITotpService totpService,
    IPublisher publisher,
    ILogger<LoginUserCommandHandler> logger)
    : BaseCommandHandler<LoginUserCommand, LoginUserResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IEnhancedJwtService _jwtService = jwtService;
    private readonly ITotpService _totpService = totpService;
    private readonly IPublisher _publisher = publisher;

    public override async Task<ApiResponse<LoginUserResponse>> Handle(
        LoginUserCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _dbContext.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                Logger.LogWarning("Failed login attempt for email {Email} from IP {IpAddress}", 
                    request.Email, request.IpAddress);

                // Track failed login attempt
                await _publisher.Publish(new LoginAttemptFailedDomainEvent(
                    request.Email,
                    request.IpAddress ?? "Unknown",
                    "Invalid credentials"), cancellationToken);

                return Error("Invalid email or password");
            }

            // Check account status
            if (user.AccountStatus == "Suspended")
            {
                return Error("Your account has been suspended. Please contact support.");
            }

            if (user.AccountStatus == "Inactive")
            {
                return Error("Your account is inactive. Please contact support.");
            }

            var requiresTwoFactor = user.TwoFactorEnabled && !string.IsNullOrEmpty(user.TwoFactorSecret);

            if (requiresTwoFactor)
            {
                if (string.IsNullOrWhiteSpace(request.TwoFactorCode))
                {
                    var profileOnly = new UserProfileData(
                        user.Id,
                        user.Email,
                        user.FirstName,
                        user.LastName,
                        user.UserRoles.Select(ur => ur.Role).ToList(),
                        user.EmailVerified,
                        user.AccountStatus,
                        user.CreatedAt,
                        user.LastLoginAt);

                    return Success(new LoginUserResponse(
                        user.Id,
                        null,
                        profileOnly,
                        !user.EmailVerified,
                        true,
                        user.LastLoginAt ?? DateTime.UtcNow),
                        "Two-factor authentication required");
                }

                if (!_totpService.VerifyCode(user.TwoFactorSecret!, request.TwoFactorCode))
                {
                    return Error("Invalid two-factor authentication code");
                }
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            user.LastLoginIp = request.IpAddress;

            // Generate JWT tokens
            var userClaims = new UserClaims
            {
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = user.UserRoles.Select(ur => ur.Role).ToList(),
                EmailVerified = user.EmailVerified,
                AccountStatus = user.AccountStatus
            };

            var tokens = await _jwtService.GenerateTokenAsync(userClaims);

            // Store new refresh token
            var refreshToken = new RefreshToken
            {
                Token = tokens.RefreshToken,
                UserId = user.Id,
                ExpiryDate = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };

            _dbContext.RefreshTokens.Add(refreshToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish successful login event
            await _publisher.Publish(new UserLoggedInDomainEvent(
                user.Id,
                request.IpAddress ?? "Unknown",
                request.DeviceInfo), cancellationToken);

            Logger.LogInformation("User {Email} logged in successfully", request.Email);

            var profileData = new UserProfileData(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                userClaims.Roles,
                user.EmailVerified,
                user.AccountStatus,
                user.CreatedAt,
                user.LastLoginAt);

            var response = new LoginUserResponse(
                user.Id,
                tokens,
                profileData,
                !user.EmailVerified,
                false,
                user.LastLoginAt ?? DateTime.UtcNow);

            return Success(response, "Login successful");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error during login for email {Email}", request.Email);
            return Error("An error occurred during login. Please try again.");
        }
    }
}
