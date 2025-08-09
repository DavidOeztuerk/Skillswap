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
    ITotpService totpService,
    IDomainEventPublisher eventPublisher,
    IPermissionRepository permissionRepository)
    : IAuthRepository
{
    private readonly UserDbContext _dbContext = userDbContext;
    private readonly IJwtService _jwtService = jwtService;
    private readonly ITotpService _totpService = totpService;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPermissionRepository _permissionService = permissionRepository;

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

        // Get user permissions for new user (will be basic User permissions)
        var userPermissions = await _permissionService.GetUserPermissionNamesAsync(user.Id, cancellationToken);
        var permissionsByCategory = await _permissionService.GetUserPermissionsByCategoryAsync(user.Id, cancellationToken);
        
        var permissions = new UserPermissions(
            user.Id,
            userClaims.Roles.ToList(),
            userPermissions.ToList(),
            permissionsByCategory);

        return new RegisterResponse(
            tokens.AccessToken, tokens.RefreshToken,
            tokens.TokenType == TokenType.Bearer.ToString() ? TokenType.Bearer : TokenType.None,
            tokens.ExpiresAt, profileData, true, permissions);
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
                // Return response indicating 2FA is required
                var tempToken = Guid.NewGuid().ToString("N");
                var userInfo = new UserInfo(
                    user.Id, user.Email, user.FirstName, user.LastName, user.UserName,
                    user.UserRoles.Where(ur => ur.IsActive).Select(ur => ur.Role).ToList(),
                    user.FavoriteSkillIds, user.EmailVerified, user.AccountStatus.ToString());

                return new LoginResponse(
                    string.Empty, string.Empty, TokenType.None, DateTime.UtcNow,
                    userInfo, true, tempToken, null); // No permissions when 2FA is required
            }

            // Verify 2FA code
            if (!_totpService.VerifyCode(user.TwoFactorSecret, twoFactorCode))
            {
                throw new UnauthorizedAccessException("Invalid 2FA code");
            }
        }

        // Get user permissions
        var userPermissions = await _permissionService.GetUserPermissionNamesAsync(user.Id);

        // Generate tokens
        var userClaims = new UserClaims
        {
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = user.UserRoles.Where(ur => ur.IsActive).Select(ur => ur.Role).ToList(),
            Permissions = userPermissions.ToList(),
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

        // Get user permissions and roles
        var permissionsByCategory = await _permissionService.GetUserPermissionsByCategoryAsync(user.Id);
        var permissions = new UserPermissions(
            user.Id,
            userClaims.Roles.ToList(),
            userPermissions.ToList(),
            permissionsByCategory);

        return new LoginResponse(
            tokens.AccessToken, tokens.RefreshToken,
            tokens.TokenType == TokenType.Bearer.ToString() ? TokenType.Bearer : TokenType.None,
            tokens.ExpiresAt, profileData, false, string.Empty, permissions);
    }

    public async Task<RefreshTokenResponse> RefreshUserToken(string accessToken, string refreshToken, CancellationToken cancellationToken = default)
    {
        // Validate the refresh token
        var storedToken = await _dbContext.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked, cancellationToken);

        if (storedToken == null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        // Check if refresh token is expired
        if (storedToken.ExpiryDate < DateTime.UtcNow)
        {
            storedToken.IsRevoked = true;
            await _dbContext.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException("Refresh token has expired");
        }

        // Validate that the access token belongs to the same user (optional extra security)
        if (!string.IsNullOrEmpty(accessToken))
        {
            try
            {
                var principal = await _jwtService.ValidateTokenAsync(accessToken);
                var tokenUserId = principal?.FindFirst("user_id")?.Value ?? principal?.FindFirst("sub")?.Value;

                if (tokenUserId != storedToken.UserId)
                {
                    throw new UnauthorizedAccessException("Token mismatch");
                }
            }
            catch
            {
                // Access token validation failed, but we can still proceed with refresh token
                // This is acceptable as the access token might be expired
            }
        }

        var user = storedToken.User;
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found for refresh token");
        }

        // Check for critical issues that should prevent token refresh
        if (user.IsDeleted)
        {
            throw new UnauthorizedAccessException("User account has been deleted");
        }

        if (user.IsAccountLocked)
        {
            throw new UnauthorizedAccessException($"User account is locked until {user.AccountLockedUntil}");
        }

        // Allow token refresh for Active and PendingVerification status
        // Users with PendingVerification can still use the app but should verify their email
        if (user.AccountStatus != AccountStatus.Active &&
            user.AccountStatus != AccountStatus.PendingVerification)
        {
            throw new UnauthorizedAccessException($"User account status is {user.AccountStatus}, refresh not allowed");
        }

        // Get user roles from database
        var userRoles = await _dbContext.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .Select(ur => ur.Role)
            .ToListAsync(cancellationToken);

        // Default to User role if no roles found
        if (!userRoles.Any())
        {
            userRoles.Add(Roles.User);
        }

        // Get user permissions
        var userPermissions = await _permissionService.GetUserPermissionNamesAsync(user.Id);

        // Create user claims for token generation
        var userClaims = new UserClaims
        {
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = userRoles,
            Permissions = userPermissions.ToList(),
            EmailVerified = user.EmailVerified,
            AccountStatus = user.AccountStatus.ToString()
        };

        var newTokens = await _jwtService.GenerateTokenAsync(userClaims);

        // Revoke old refresh token
        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.RevokedReason = "Token refreshed";

        // Store new refresh token
        var newRefreshToken = new RefreshToken
        {
            Token = newTokens.RefreshToken,
            UserId = user.Id.ToString(),
            CreatedAt = DateTime.UtcNow,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            UserAgent = storedToken.UserAgent, // Keep the same user agent
            IpAddress = storedToken.IpAddress,
            IsRevoked = false
        };

        _dbContext.RefreshTokens.Add(newRefreshToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Return new tokens with correct parameters
        return new RefreshTokenResponse(
            newTokens.AccessToken,
            newTokens.RefreshToken,
            newTokens.TokenType,
            newTokens.ExpiresIn,
            newTokens.ExpiresAt);
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
