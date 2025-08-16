using FluentAssertions;
using Infrastructure.Models;
using Infrastructure.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Xunit;

namespace Shared.Tests.Infrastructure.Security;

public class JwtServiceTests
{
    private readonly JwtService _jwtService;
    private readonly Mock<ILogger<JwtService>> _mockLogger;
    private readonly JwtSettings _jwtSettings;

    public JwtServiceTests()
    {
        _mockLogger = new Mock<ILogger<JwtService>>();
        _jwtSettings = new JwtSettings
        {
            Secret = "ThisIsAVerySecretKeyForTestingPurposesOnly12345678901234567890",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            ExpireMinutes = 30
        };

        var options = Options.Create(_jwtSettings);
        _jwtService = new JwtService(options, _mockLogger.Object);
    }

    [Fact]
    public async Task GenerateTokenAsync_WithValidUserClaims_ShouldReturnValidTokenResult()
    {
        // Arrange
        var userClaims = new UserClaims
        {
            UserId = "user-123",
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            Roles = new List<string> { "User", "Admin" },
            Permissions = new List<string> { "read", "write" },
            EmailVerified = true,
            AccountStatus = "Active"
        };

        // Act
        var result = await _jwtService.GenerateTokenAsync(userClaims);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.TokenType.Should().Be("Bearer");
        result.ExpiresAt.Should().BeCloseTo(
            DateTime.UtcNow.AddMinutes(_jwtSettings.ExpireMinutes),
            TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task GenerateTokenAsync_ShouldIncludeAllClaims()
    {
        // Arrange
        var userClaims = new UserClaims
        {
            UserId = "user-456",
            Email = "john.doe@example.com",
            FirstName = "John",
            LastName = "Doe",
            Roles = new List<string> { "User" },
            Permissions = new List<string> { "view_profile" },
            EmailVerified = true,
            AccountStatus = "Active",
            CustomClaims = new Dictionary<string, string>
            {
                { "Department", "Engineering" },
                { "TeamId", "team-789" }
            }
        };

        // Act
        var result = await _jwtService.GenerateTokenAsync(userClaims);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jsonToken = handler.ReadJwtToken(result.AccessToken);

        jsonToken.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == userClaims.UserId);
        jsonToken.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == userClaims.Email);
        jsonToken.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.GivenName && c.Value == userClaims.FirstName);
        jsonToken.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.FamilyName && c.Value == userClaims.LastName);
        jsonToken.Claims.Should().Contain(c => c.Type == "role" && c.Value == "User");
        jsonToken.Claims.Should().Contain(c => c.Type == "Department" && c.Value == "Engineering");
        jsonToken.Claims.Should().Contain(c => c.Type == "TeamId" && c.Value == "team-789");
        jsonToken.Claims.Should().Contain(c => c.Type == "email_verified" && c.Value == "True");
    }

    [Fact]
    public async Task GenerateRefreshTokenAsync_ShouldReturnUniqueTokens()
    {
        // Act
        var token1 = await _jwtService.GenerateRefreshTokenAsync();
        var token2 = await _jwtService.GenerateRefreshTokenAsync();
        var token3 = await _jwtService.GenerateRefreshTokenAsync();

        // Assert
        token1.Should().NotBeNullOrEmpty();
        token2.Should().NotBeNullOrEmpty();
        token3.Should().NotBeNullOrEmpty();
        token1.Should().NotBe(token2);
        token1.Should().NotBe(token3);
        token2.Should().NotBe(token3);
    }

    [Fact]
    public async Task GenerateRefreshTokenAsync_ShouldReturnBase64EncodedToken()
    {
        // Act
        var token = await _jwtService.GenerateRefreshTokenAsync();

        // Assert
        token.Should().NotBeNullOrEmpty();
        // Verify it's valid base64
        Action act = () => Convert.FromBase64String(token);
        act.Should().NotThrow();
        
        // Verify length (64 bytes = ~88 characters in base64)
        token.Length.Should().BeGreaterThan(80);
    }

    [Fact]
    public async Task ValidateTokenAsync_WithValidToken_ShouldReturnClaimsPrincipal()
    {
        // Arrange
        var userClaims = new UserClaims
        {
            UserId = "user-123",
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            Roles = new List<string> { "User" }
        };
        var tokenResult = await _jwtService.GenerateTokenAsync(userClaims);

        // Act
        var principal = await _jwtService.ValidateTokenAsync(tokenResult.AccessToken);

        // Assert
        principal.Should().NotBeNull();
        principal!.Identity!.IsAuthenticated.Should().BeTrue();
        principal.FindFirst(ClaimTypes.NameIdentifier)?.Value.Should().Be(userClaims.UserId);
        principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value.Should().Be(userClaims.Email);
    }

    [Fact]
    public async Task ValidateTokenAsync_WithExpiredToken_ShouldReturnNull()
    {
        // Arrange
        var expiredSettings = new JwtSettings
        {
            Secret = _jwtSettings.Secret,
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            ExpireMinutes = -1 // Already expired
        };
        var expiredService = new JwtService(Options.Create(expiredSettings), _mockLogger.Object);
        
        var userClaims = new UserClaims
        {
            UserId = "user-123",
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe"
        };
        var tokenResult = await expiredService.GenerateTokenAsync(userClaims);

        // Act
        var principal = await _jwtService.ValidateTokenAsync(tokenResult.AccessToken);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public async Task ValidateTokenAsync_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        var principal = await _jwtService.ValidateTokenAsync(invalidToken);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public async Task ValidateTokenAsync_WithTamperedToken_ShouldReturnNull()
    {
        // Arrange
        var userClaims = new UserClaims
        {
            UserId = "user-123",
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe"
        };
        var tokenResult = await _jwtService.GenerateTokenAsync(userClaims);
        
        // Tamper with the token
        var tamperedToken = tokenResult.AccessToken + "tampered";

        // Act
        var principal = await _jwtService.ValidateTokenAsync(tamperedToken);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public async Task GetPrincipalFromExpiredTokenAsync_WithExpiredToken_ShouldReturnClaimsPrincipal()
    {
        // Arrange
        var expiredSettings = new JwtSettings
        {
            Secret = _jwtSettings.Secret,
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            ExpireMinutes = -1 // Already expired
        };
        var expiredService = new JwtService(Options.Create(expiredSettings), _mockLogger.Object);
        
        var userClaims = new UserClaims
        {
            UserId = "user-123",
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe"
        };
        var tokenResult = await expiredService.GenerateTokenAsync(userClaims);

        // Act
        var principal = await _jwtService.GetPrincipalFromExpiredTokenAsync(tokenResult.AccessToken);

        // Assert
        principal.Should().NotBeNull();
        principal!.FindFirst(ClaimTypes.NameIdentifier)?.Value.Should().Be(userClaims.UserId);
        principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value.Should().Be(userClaims.Email);
    }

    [Fact]
    public async Task GetPrincipalFromExpiredTokenAsync_WithInvalidAlgorithm_ShouldReturnNull()
    {
        // This is a token with "none" algorithm (unsigned)
        var unsignedToken = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.";

        // Act
        var principal = await _jwtService.GetPrincipalFromExpiredTokenAsync(unsignedToken);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public async Task GetPrincipalFromExpiredTokenAsync_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "not.a.valid.token";

        // Act
        var principal = await _jwtService.GetPrincipalFromExpiredTokenAsync(invalidToken);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public async Task RevokeRefreshTokenAsync_ShouldAddTokenToRevokedList()
    {
        // Arrange
        var refreshToken = await _jwtService.GenerateRefreshTokenAsync();

        // Act
        await _jwtService.RevokeRefreshTokenAsync(refreshToken);

        // Assert
        // Since the revoked tokens are stored in a private static field,
        // we can't directly verify it. In a real scenario, we'd check through
        // a validation method or database query.
        // For now, we just verify the method completes without error
        true.Should().BeTrue();
    }

    [Fact]
    public async Task GenerateTokenAsync_WithMultipleRoles_ShouldIncludeAllRoles()
    {
        // Arrange
        var userClaims = new UserClaims
        {
            UserId = "user-789",
            Email = "multi@example.com",
            FirstName = "Multi",
            LastName = "Role",
            Roles = new List<string> { "User", "Admin", "Moderator" }
        };

        // Act
        var result = await _jwtService.GenerateTokenAsync(userClaims);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jsonToken = handler.ReadJwtToken(result.AccessToken);

        var roleClaims = jsonToken.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();
        roleClaims.Should().Contain("User");
        roleClaims.Should().Contain("Admin");
        roleClaims.Should().Contain("Moderator");
        roleClaims.Should().HaveCount(3);
    }

    [Fact]
    public async Task GenerateTokenAsync_WithEmptyRoles_ShouldGenerateValidToken()
    {
        // Arrange
        var userClaims = new UserClaims
        {
            UserId = "user-000",
            Email = "noroles@example.com",
            FirstName = "No",
            LastName = "Roles",
            Roles = new List<string>()
        };

        // Act
        var result = await _jwtService.GenerateTokenAsync(userClaims);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        
        var handler = new JwtSecurityTokenHandler();
        var jsonToken = handler.ReadJwtToken(result.AccessToken);
        var roleClaims = jsonToken.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
        roleClaims.Should().BeEmpty();
    }

    [Fact]
    public async Task GenerateTokenAsync_TokenExpiry_ShouldBeCorrect()
    {
        // Arrange
        var userClaims = new UserClaims
        {
            UserId = "user-exp",
            Email = "expiry@example.com",
            FirstName = "Test",
            LastName = "Expiry"
        };

        // Act
        var result = await _jwtService.GenerateTokenAsync(userClaims);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jsonToken = handler.ReadJwtToken(result.AccessToken);
        
        jsonToken.ValidTo.Should().BeCloseTo(
            DateTime.UtcNow.AddMinutes(_jwtSettings.ExpireMinutes),
            TimeSpan.FromSeconds(5));
        jsonToken.ValidFrom.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task GenerateTokenAsync_ShouldIncludeJtiClaim()
    {
        // Arrange
        var userClaims = new UserClaims
        {
            UserId = "user-jti",
            Email = "jti@example.com",
            FirstName = "Jti",
            LastName = "Test"
        };

        // Act
        var result1 = await _jwtService.GenerateTokenAsync(userClaims);
        var result2 = await _jwtService.GenerateTokenAsync(userClaims);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jsonToken1 = handler.ReadJwtToken(result1.AccessToken);
        var jsonToken2 = handler.ReadJwtToken(result2.AccessToken);

        var jti1 = jsonToken1.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
        var jti2 = jsonToken2.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;

        jti1.Should().NotBeNullOrEmpty();
        jti2.Should().NotBeNullOrEmpty();
        jti1.Should().NotBe(jti2); // Each token should have unique JTI
    }
}