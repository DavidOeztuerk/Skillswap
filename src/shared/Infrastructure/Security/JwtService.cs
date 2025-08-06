using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Infrastructure.Models;

namespace Infrastructure.Security;

public class JwtService(
    IOptions<JwtSettings> jwtSettings,
    ILogger<JwtService> logger) 
    : IJwtService
{
    private readonly JwtSettings _jwtSettings = jwtSettings.Value;
    private readonly ILogger<JwtService> _logger = logger;
    private static readonly HashSet<string> RevokedTokens = [];

    public async Task<TokenResult> GenerateTokenAsync(UserClaims user)
    {
        user.Permissions = [.. RolePermissions
            .GetPermissionsForRoles(user.Roles)
            .Union(user.Permissions)
            .Distinct()];

        var accessToken = await GenerateAccessTokenAsync(user);
        var refreshToken = await GenerateRefreshTokenAsync();

        _logger.LogInformation("Generated tokens for user {UserId} with roles {Roles}",
            user.UserId, string.Join(", ", user.Roles));

        return new TokenResult
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpireMinutes),
            TokenType = "Bearer"
        };
    }

    private async Task<string> GenerateAccessTokenAsync(UserClaims user)
    {
        var signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret)),
            SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.GivenName, user.FirstName),
            new(JwtRegisteredClaimNames.FamilyName, user.LastName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat,
                new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),
            new("user_id", user.UserId),
            new("email_verified", user.EmailVerified.ToString(), ClaimValueTypes.Boolean),
            new("account_status", user.AccountStatus)
        };

        // Add role claims
        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim("role", role)); // Custom claim for easier access
        }

        // Add permission claims
        foreach (var permission in user.Permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        // Add custom claims
        if (user.CustomClaims != null)
        {
            foreach (var customClaim in user.CustomClaims)
            {
                claims.Add(new Claim(customClaim.Key, customClaim.Value));
            }
        }

        var securityToken = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpireMinutes),
            claims: claims,
            signingCredentials: signingCredentials);

        return await Task.FromResult(new JwtSecurityTokenHandler().WriteToken(securityToken));
    }

    public async Task<string> GenerateRefreshTokenAsync()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);

        var refreshToken = Convert.ToBase64String(randomNumber);

        _logger.LogDebug("Generated new refresh token");

        return await Task.FromResult(refreshToken);
    }

    public async Task<ClaimsPrincipal?> GetPrincipalFromExpiredTokenAsync(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret)),
            ValidateLifetime = false, // Don't validate expiry for refresh token scenario
            ValidIssuer = _jwtSettings.Issuer,
            ValidAudience = _jwtSettings.Audience,
            ClockSkew = TimeSpan.Zero
        };

        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                _logger.LogWarning("Invalid token algorithm or format");
                return null;
            }

            return await Task.FromResult(principal);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract principal from expired token");
            return null;
        }
    }

    public async Task<ClaimsPrincipal?> ValidateTokenAsync(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret)),
            ValidateLifetime = true,
            ValidIssuer = _jwtSettings.Issuer,
            ValidAudience = _jwtSettings.Audience,
            ClockSkew = TimeSpan.Zero
        };

        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

            // Check if token is revoked
            var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            if (!string.IsNullOrEmpty(jti) && RevokedTokens.Contains(jti))
            {
                _logger.LogWarning("Token with JTI {Jti} has been revoked", jti);
                return null;
            }

            return await Task.FromResult(principal);
        }
        catch (SecurityTokenExpiredException)
        {
            _logger.LogDebug("Token has expired");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Token validation failed");
            return null;
        }
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        // In a real implementation, this would be stored in a database or Redis
        // For now, we'll use an in-memory set
        RevokedTokens.Add(refreshToken);

        _logger.LogInformation("Refresh token revoked");

        await Task.CompletedTask;
    }
}
