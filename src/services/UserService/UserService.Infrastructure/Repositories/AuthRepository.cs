using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Enums;
using Infrastructure.Security;
using EventSourcing;
using Events.Domain.User;
using Contracts.User.Responses.Auth;
using Contracts.User.Responses;

namespace UserService.Infrastructure.Repositories;

public class AuthRepository(
    UserDbContext userDbContext,
    IJwtService jwtService,
    IDomainEventPublisher eventPublisher) : IAuthRepository
{
    private readonly UserDbContext _dbContext = userDbContext;
    private readonly IJwtService _jwtService = jwtService;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public async Task<RegisterResponse> RegisterUserWithTokens(string email, string password, string firstName, string lastName, string userName, CancellationToken cancellationToken = default)
    {
        // Check if email already exists
        var isEmailTaken = await _dbContext.Users.AnyAsync(u => u.Email == email, cancellationToken);
        if (isEmailTaken)
        {
            throw new InvalidOperationException("Email address is already registered");
        }

        // Create new user
        var user = new User
        {
            Email = email,
            UserName = userName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            FirstName = firstName,
            LastName = lastName,
            AccountStatus = AccountStatus.PendingVerification,
            EmailVerified = false,
            CreatedAt = DateTime.UtcNow,
            EmailVerificationToken = Guid.NewGuid().ToString("N"),
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddDays(1)
        };

        // Add user
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Add default role
        var userRole = new UserRole
        {
            UserId = user.Id,
            Role = Roles.User,
            AssignedAt = DateTime.UtcNow
        };
        _dbContext.UserRoles.Add(userRole);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Generate JWT tokens
        var userClaims = new UserClaims
        {
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = [Roles.User],
            EmailVerified = false,
            AccountStatus = user.AccountStatus.ToString()
        };

        var tokens = await _jwtService.GenerateTokenAsync(userClaims);

        // Store refresh token
        var refreshToken = new RefreshToken
        {
            Token = tokens.RefreshToken,
            UserId = user.Id,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish events
        await _eventPublisher.Publish(new UserRegisteredDomainEvent(
            user.Id, user.Email, user.FirstName, user.LastName), cancellationToken);

        await _eventPublisher.Publish(new EmailVerificationRequestedDomainEvent(
            user.Id, user.Email, user.EmailVerificationToken!, user.FirstName), cancellationToken);

        var profileData = new UserInfo(
            user.Id, user.Email, user.FirstName, user.LastName, user.UserName,
            userClaims.Roles, user.FavoriteSkillIds, user.EmailVerified, user.AccountStatus.ToString());

        return new RegisterResponse(
            tokens.AccessToken, tokens.RefreshToken,
            tokens.TokenType == TokenType.Bearer.ToString() ? TokenType.Bearer : TokenType.None,
            tokens.ExpiresAt, profileData, true);
    }

    public async Task<LoginResponse> LoginUser(string email, string password, string? twoFactorCode = null, string? deviceId = null, string? deviceInfo = null, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        // 2FA validation if enabled
        if (user.TwoFactorEnabled && !string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            if (string.IsNullOrEmpty(twoFactorCode))
            {
                throw new UnauthorizedAccessException("Two-factor authentication code required");
            }

            // This would need ITotpService injection
            // if (!_totpService.VerifyCode(user.TwoFactorSecret, twoFactorCode))
            // {
            //     throw new UnauthorizedAccessException("Invalid 2FA code");
            // }
        }

        // Generate tokens
        var userClaims = new UserClaims
        {
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = user.UserRoles.Where(ur => ur.IsActive).Select(ur => ur.Role).ToList(),
            EmailVerified = user.EmailVerified,
            AccountStatus = user.AccountStatus.ToString()
        };

        var tokens = await _jwtService.GenerateTokenAsync(userClaims);

        // Store refresh token
        var refreshToken = new RefreshToken
        {
            Token = tokens.RefreshToken,
            UserId = user.Id,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish login event
        await _eventPublisher.Publish(new UserLoggedInDomainEvent(
            user.Id, deviceId!, deviceInfo), cancellationToken);

        var profileData = new UserInfo(
            user.Id, user.Email, user.FirstName, user.LastName, user.UserName,
            userClaims.Roles, user.FavoriteSkillIds, user.EmailVerified, user.AccountStatus.ToString());

        return new LoginResponse(
            tokens.AccessToken, tokens.RefreshToken,
            tokens.TokenType == TokenType.Bearer.ToString() ? TokenType.Bearer : TokenType.None,
            tokens.ExpiresAt, profileData, true, "");
    }

    public async Task<RefreshTokenResponse> RefreshUserToken(string accessToken, string refreshToken, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
        // Implementation for token refresh
        throw new NotImplementedException("RefreshUserToken implementation pending");
    }

    public async Task<bool> VerifyEmail(string email, string token, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.EmailVerificationToken == token, cancellationToken);

        if (user == null || user.EmailVerificationTokenExpiresAt < DateTime.UtcNow)
        {
            return false;
        }

        user.EmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiresAt = null;
        user.AccountStatus = AccountStatus.Active;
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task ResendVerificationEmail(string email, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user == null || user.EmailVerified) return;

        user.EmailVerificationToken = Guid.NewGuid().ToString("N");
        user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddDays(1);
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        await _eventPublisher.Publish(new EmailVerificationRequestedDomainEvent(
            user.Id, user.Email, user.EmailVerificationToken, user.FirstName), cancellationToken);
    }

    public async Task RequestPasswordReset(string email, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user == null) return; // Don't reveal if email exists

        user.PasswordResetToken = Guid.NewGuid().ToString("N");
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish password reset event
        // await _eventPublisher.Publish(new PasswordResetRequestedDomainEvent(...), cancellationToken);
    }

    public async Task<bool> ResetPassword(string email, string token, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.PasswordResetToken == token, cancellationToken);

        if (user == null || user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
        {
            return false;
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        // Revoke all refresh tokens
        var refreshTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var rt in refreshTokens)
        {
            rt.IsRevoked = true;
            rt.RevokedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}