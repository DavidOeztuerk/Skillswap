using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using Infrastructure.Security;

namespace UserService.Infrastructure.Repositories;

public class TwoFactorRepository(
    UserDbContext userDbContext,
    ITotpService totpService) : ITwoFactorRepository
{
    private readonly UserDbContext _dbContext = userDbContext;
    private readonly ITotpService _totpService = totpService;

    public async Task<(string secret, string qrCodeUri, string manualEntryKey)> GenerateTwoFactorSecret(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            var secret = _totpService.GenerateSecret();
            user.TwoFactorSecret = secret;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            
            // Generate QR code URI for authenticator apps
            var issuer = "SkillSwap";
            var accountName = user.Email ?? user.UserName ?? userId;
            var qrCodeUri = $"otpauth://totp/{issuer}:{accountName}?secret={secret}&issuer={issuer}";
            
            // Manual entry key is the secret formatted for easier typing
            var manualEntryKey = FormatSecretForDisplay(secret);
            
            return (secret, qrCodeUri, manualEntryKey);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to generate two-factor secret for user {userId}", ex);
        }
    }
    
    private string FormatSecretForDisplay(string secret)
    {
        // Format the secret in groups of 4 characters for easier manual entry
        var formatted = "";
        for (int i = 0; i < secret.Length; i += 4)
        {
            if (i > 0) formatted += " ";
            formatted += secret.Substring(i, Math.Min(4, secret.Length - i));
        }
        return formatted;
    }

    public async Task<bool> VerifyTwoFactorCode(string userId, string code, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null || string.IsNullOrEmpty(user.TwoFactorSecret))
            {
                return false;
            }

            var isValid = _totpService.VerifyCode(user.TwoFactorSecret, code);
            
            // Auto-enable 2FA if verification is successful and not yet enabled
            if (isValid && !user.TwoFactorEnabled)
            {
                user.TwoFactorEnabled = true;
                user.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            return isValid;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to verify two-factor code for user {userId}", ex);
        }
    }

    public async Task<(bool hasSecret, bool isEnabled)> GetTwoFactorStatus(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
            {
                return (false, false);
            }

            return (!string.IsNullOrEmpty(user.TwoFactorSecret), user.TwoFactorEnabled);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get two-factor status for user {userId}", ex);
        }
    }

    public async Task UpdateTwoFactorSecret(string userId, string secret, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            user.TwoFactorSecret = secret;
            user.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to update two-factor secret for user {userId}", ex);
        }
    }

    public async Task EnableTwoFactor(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            if (string.IsNullOrEmpty(user.TwoFactorSecret))
            {
                throw new InvalidOperationException("Cannot enable two-factor authentication without a secret");
            }

            user.TwoFactorEnabled = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to enable two-factor authentication for user {userId}", ex);
        }
    }

    public async Task DisableTwoFactor(string userId, string password, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            // Verify password before disabling 2FA
            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid password provided");
            }

            user.TwoFactorEnabled = false;
            user.TwoFactorSecret = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to disable two-factor authentication for user {userId}", ex);
        }
    }
}