using Microsoft.EntityFrameworkCore;
using UserService.Domain.Enums;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using Infrastructure.Security;
using EventSourcing;
using Events.Domain.User;
using Contracts.User.Responses.Auth;
using Contracts.User.Responses;
using Core.Common.Exceptions;
using Core.Common;

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

    public async Task<RegisterResponse> RegisterUserWithTokens(
        string email, string password, string firstName, string lastName, string userName,
        CancellationToken cancellationToken = default)
    {
        if (await _dbContext.Users.AnyAsync(u => u.Email == email, cancellationToken))
            throw new ResourceAlreadyExistsException("User", "email", email);

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
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddDays(3)
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Default-Role "User" auflösen und Join anlegen
        var roleUser = await _dbContext.Roles
            .Where(r => r.Name == "User" && r.IsActive)
            .Select(r => new { r.Id })
            .FirstOrDefaultAsync(cancellationToken);

        if (roleUser is not null)
        {
            _dbContext.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = roleUser.Id,
                AssignedAt = DateTime.UtcNow
            });
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        // Claims
        var roleNames = await _dbContext.UserRoles
            .Where(ur => ur.UserId == user.Id && ur.RevokedAt == null)
            .Include(ur => ur.Role)
            .Select(ur => ur.Role.Name)
            .ToListAsync(cancellationToken);

        if (roleNames.Count == 0) roleNames.Add("User");

        var userClaims = new UserClaims
        {
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roleNames,
            EmailVerified = false,
            AccountStatus = user.AccountStatus.ToString()
        };

        var tokens = await _jwtService.GenerateTokenAsync(userClaims);

        // RefreshToken speichern
        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            Token = tokens.RefreshToken,
            UserId = user.Id,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Events
        await _eventPublisher.Publish(
            new UserRegisteredDomainEvent(user.Id, user.Email, user.FirstName, user.LastName),
            cancellationToken);

        await _eventPublisher.Publish(
            new EmailVerificationRequestedDomainEvent(user.Id, user.Email, user.EmailVerificationToken!, user.FirstName),
            cancellationToken);

        var profileData = new UserInfo(
            user.Id, user.Email, user.FirstName, user.LastName, user.UserName,
            roleNames, user.FavoriteSkillIds, user.EmailVerified, user.AccountStatus.ToString());

        var userPermissions = await _permissionService.GetUserPermissionNamesAsync(user.Id, cancellationToken);
        var permissionsByCategory = await _permissionService.GetUserPermissionsByCategoryAsync(user.Id, cancellationToken);

        var permissions = new UserPermissions(
            user.Id,
            roleNames.ToList(),
            userPermissions.ToList(),
            permissionsByCategory);

        var tokenType = string.Equals(tokens.TokenType, TokenType.Bearer.ToString(), StringComparison.OrdinalIgnoreCase)
            ? TokenType.Bearer
            : TokenType.None;

        return new RegisterResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokenType,
            tokens.ExpiresAt,
            profileData,
            true,
            permissions);
    }

    public async Task<LoginResponse> LoginUser(
        string email, string password, string? twoFactorCode = null, string? deviceId = null, string? deviceInfo = null,
        CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            throw new InvalidCredentialsException(email);

        if (!user.EmailVerified && user.CreatedAt.AddDays(3) < DateTime.UtcNow)
            throw new EmailVerificationRequiredException(user.Email, user.CreatedAt);

        if (user.TwoFactorEnabled && !string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            if (string.IsNullOrEmpty(twoFactorCode))
            {
                var tempToken = Guid.NewGuid().ToString("N");
                var roleNames2Fa = user.UserRoles.Where(ur => ur.RevokedAt == null)
                                                 .Select(ur => ur.Role.Name).ToList();

                var userInfo2Fa = new UserInfo(
                    user.Id, user.Email, user.FirstName, user.LastName, user.UserName,
                    roleNames2Fa, user.FavoriteSkillIds, user.EmailVerified, user.AccountStatus.ToString());

                return new LoginResponse(
                    string.Empty, string.Empty, TokenType.None, DateTime.UtcNow,
                    userInfo2Fa, true, tempToken, null);
            }

            if (!_totpService.VerifyCode(user.TwoFactorSecret, twoFactorCode))
                throw new UnauthorizedAccessException("Invalid 2FA code");
        }

        var roleNames = user.UserRoles.Where(ur => ur.RevokedAt == null)
                                      .Select(ur => ur.Role.Name)
                                      .ToList();
        if (roleNames.Count == 0) roleNames.Add("User");

        var userPermissionNames = await _permissionService.GetUserPermissionNamesAsync(user.Id, cancellationToken);

        var userClaims = new UserClaims
        {
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roleNames,
            Permissions = userPermissionNames.ToList(),
            EmailVerified = user.EmailVerified,
            AccountStatus = user.AccountStatus.ToString()
        };

        var tokens = await _jwtService.GenerateTokenAsync(userClaims);

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            Token = tokens.RefreshToken,
            UserId = user.Id,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _eventPublisher.Publish(
            new UserLoggedInDomainEvent(user.Id, deviceId ?? string.Empty, deviceInfo),
            cancellationToken);

        var profileData = new UserInfo(
            user.Id, user.Email, user.FirstName, user.LastName, user.UserName,
            roleNames, user.FavoriteSkillIds, user.EmailVerified, user.AccountStatus.ToString());

        var permissionsByCategory = await _permissionService.GetUserPermissionsByCategoryAsync(user.Id, cancellationToken);

        var permissions = new UserPermissions(
            user.Id,
            roleNames.ToList(),
            userPermissionNames.ToList(),
            permissionsByCategory);

        var tokenType = string.Equals(tokens.TokenType, TokenType.Bearer.ToString(), StringComparison.OrdinalIgnoreCase)
            ? TokenType.Bearer
            : TokenType.None;

        return new LoginResponse(
            tokens.AccessToken, tokens.RefreshToken,
            tokenType, tokens.ExpiresAt,
            profileData, false, string.Empty, permissions);
    }

    public async Task<RefreshTokenResponse> RefreshUserToken(
        string accessToken, string refreshToken, CancellationToken cancellationToken = default)
    {
        var storedToken = await _dbContext.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked, cancellationToken);

        if (storedToken == null)
            throw new UnauthorizedAccessException("Invalid refresh token");

        if (storedToken.ExpiryDate < DateTime.UtcNow)
        {
            storedToken.IsRevoked = true;
            storedToken.RevokedAt = DateTime.UtcNow;
            storedToken.RevokedReason = "Expired";
            await _dbContext.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException("Refresh token has expired");
        }

        if (!string.IsNullOrEmpty(accessToken))
        {
            try
            {
                var principal = await _jwtService.ValidateTokenAsync(accessToken);
                var tokenUserId = principal?.FindFirst("user_id")?.Value ?? principal?.FindFirst("sub")?.Value;
                if (!string.IsNullOrEmpty(tokenUserId) && tokenUserId != storedToken.UserId)
                    throw new UnauthorizedAccessException("Token mismatch");
            }
            catch
            {
                // Ignorieren (Access Token kann legit abgelaufen sein)
            }
        }

        var user = storedToken.User ?? throw new UnauthorizedAccessException("User not found for refresh token");

        if (user.IsDeleted)
            throw new UnauthorizedAccessException("User account has been deleted");

        if (user.IsAccountLocked)
            throw new UnauthorizedAccessException($"User account is locked until {user.AccountLockedUntil}");

        if (user.AccountStatus is not (AccountStatus.Active or AccountStatus.PendingVerification))
            throw new UnauthorizedAccessException($"User account status is {user.AccountStatus}, refresh not allowed");

        var roleNames = await _dbContext.UserRoles
            .Where(ur => ur.UserId == user.Id && ur.RevokedAt == null)
            .Include(ur => ur.Role)
            .Select(ur => ur.Role.Name)
            .ToListAsync(cancellationToken);

        if (roleNames.Count == 0) roleNames.Add("User");

        var userPermissionNames = await _permissionService.GetUserPermissionNamesAsync(user.Id, cancellationToken);

        var claims = new UserClaims
        {
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roleNames,
            Permissions = userPermissionNames.ToList(),
            EmailVerified = user.EmailVerified,
            AccountStatus = user.AccountStatus.ToString()
        };

        var newTokens = await _jwtService.GenerateTokenAsync(claims);

        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.RevokedReason = "Token refreshed";

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            Token = newTokens.RefreshToken,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            UserAgent = storedToken.UserAgent,
            IpAddress = storedToken.IpAddress,
            IsRevoked = false
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

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
            return false;

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
        user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddDays(3);
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        await _eventPublisher.Publish(
            new EmailVerificationRequestedDomainEvent(user.Id, user.Email, user.EmailVerificationToken, user.FirstName),
            cancellationToken);
    }

    public async Task RequestPasswordReset(string email, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user == null) return;

        user.PasswordResetToken = Guid.NewGuid().ToString("N");
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Optional: Event publizieren
        // await _eventPublisher.Publish(new PasswordResetRequestedDomainEvent(...), cancellationToken);
    }

    public async Task<bool> ResetPassword(string email, string token, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.PasswordResetToken == token, cancellationToken);

        if (user == null || user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        var refreshTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var rt in refreshTokens)
        {
            rt.IsRevoked = true;
            rt.RevokedAt = DateTime.UtcNow;
            rt.RevokedReason = "Password changed";
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
