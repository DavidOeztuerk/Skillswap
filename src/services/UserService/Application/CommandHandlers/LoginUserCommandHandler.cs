using CQRS.Handlers;
using Infrastructure.Models;
using Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;
using UserService.Domain.Models;
using EventSourcing;
using Events.Domain.User;
using Contracts.User.Responses.Auth;

namespace UserService.Application.CommandHandlers;

public class LoginUserCommandHandler(
    UserDbContext dbContext,
    IJwtService jwtService,
    ITotpService totpService,
    IDomainEventPublisher eventPublisher,
    ILogger<LoginUserCommandHandler> logger)
    : BaseCommandHandler<LoginUserCommand, LoginResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IJwtService _jwtService = jwtService;
    private readonly ITotpService _totpService = totpService;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<LoginResponse>> Handle(
        LoginUserCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var email = request.Email;
            var user = await _dbContext.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                Logger.LogWarning("Failed login attempt for email {Email} from IP {IpAddress}",
                    email, request.DeviceInfo);

                // Track failed login attempt
                await _eventPublisher.Publish(new LoginAttemptFailedDomainEvent(
                    email,
                    request.DeviceInfo ?? "Unknown",
                    "Invalid credentials"), cancellationToken);

                return Error("Invalid email or password");
            }

            // Check account status
            if (user.AccountStatus == AccountStatus.Suspended)
            {
                return Error("Your account has been suspended. Please contact support.");
            }

            if (user.AccountStatus == AccountStatus.Inactive)
            {
                return Error("Your account is inactive. Please contact support.");
            }

            var requiresTwoFactor = user.TwoFactorEnabled && !string.IsNullOrEmpty(user.TwoFactorSecret);

            if (requiresTwoFactor)
            {
                if (string.IsNullOrWhiteSpace(request.TwoFactorCode))
                {
                    var profileOnly = new UserInfo(
                        user.Id,
                        user.Email,
                        user.FirstName,
                        user.LastName,
                        user.UserName,
                        user.UserRoles
                            .Where(ur => ur.RevokedAt == null && !ur.IsDeleted)
                            .Select(ur => ur.Role)
                            .ToList(),
                        user.FavoriteSkillIds,
                        user.EmailVerified,
                        user.AccountStatus);

                    return Success(new LoginResponse(
                        "WaitCallback", // Assuming the first parameter is for token or userId
                        "null", // Add appropriate value for the second parameter
                        TokenType.None, // Add appropriate value for the third parameter
                        user.LastLoginAt ?? DateTime.UtcNow,
                        profileOnly,
                        !user.EmailVerified,
                        string.Empty), // Add appropriate value for the last parameter (string?)
                        "Two-factor authentication required");
                }

                if (!_totpService.VerifyCode(user.TwoFactorSecret!, request.TwoFactorCode))
                {
                    return Error("Invalid two-factor authentication code");
                }
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            user.LastLoginIp = request.DeviceInfo;

            // Generate JWT tokens

            var userClaims = new UserClaims
            {
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = [.. user.UserRoles
                    .Where(ur => ur.RevokedAt == null && !ur.IsDeleted)
                    .Select(ur => ur.Role)],
                EmailVerified = user.EmailVerified,
                AccountStatus = user.AccountStatus.ToString()
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
            await _eventPublisher.Publish(new UserLoggedInDomainEvent(
                user.Id,
                request.DeviceInfo ?? "Unknown",
                request.DeviceInfo), cancellationToken);


            Logger.LogInformation("User {Email} logged in successfully", user.Email);


            var profileData = new UserInfo(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.UserName,
                userClaims.Roles,
                user.FavoriteSkillIds,
                user.EmailVerified,
                user.AccountStatus);

            var response = new LoginResponse(
                tokens.AccessToken,
                tokens.RefreshToken,
                tokens.TokenType == TokenType.Bearer.ToString() ? TokenType.Bearer : TokenType.None,
                tokens.ExpiresAt,
                profileData,
                requiresTwoFactor,
                string.Empty
            );

            return Success(response, "Login successful");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error during login for email {Email}", request.Email);
            return Error("An error occurred during login. Please try again.");
        }
    }
}
