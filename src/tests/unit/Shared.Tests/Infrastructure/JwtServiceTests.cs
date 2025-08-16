using FluentAssertions;
using Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Moq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Xunit;

namespace Shared.Tests.Infrastructure;

public class JwtServiceTests
{
    private readonly JwtService _jwtService;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private const string SecretKey = "ThisIsAVeryLongSecretKeyForTestingPurposesOnly123456789";
    private const string Issuer = "TestIssuer";
    private const string Audience = "TestAudience";

    public JwtServiceTests()
    {
        _mockConfiguration = new Mock<IConfiguration>();
        
        _mockConfiguration.Setup(x => x["Jwt:Key"]).Returns(SecretKey);
        _mockConfiguration.Setup(x => x["Jwt:Issuer"]).Returns(Issuer);
        _mockConfiguration.Setup(x => x["Jwt:Audience"]).Returns(Audience);
        _mockConfiguration.Setup(x => x["Jwt:ExpirationInMinutes"]).Returns("60");
        _mockConfiguration.Setup(x => x["Jwt:RefreshTokenExpirationInDays"]).Returns("7");

        _jwtService = new JwtService(_mockConfiguration.Object);
    }

    [Fact]
    public void GenerateToken_ShouldCreateValidJwtToken()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var email = "test@example.com";
        var roles = new[] { "User", "Admin" };

        // Act
        var token = _jwtService.GenerateToken(userId, email, roles);

        // Assert
        token.Should().NotBeNullOrEmpty();
        
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwt = tokenHandler.ReadJwtToken(token);
        
        jwt.Issuer.Should().Be(Issuer);
        jwt.Audiences.Should().Contain(Audience);
        jwt.Claims.Should().Contain(c => c.Type == "sub" && c.Value == userId.ToString());
        jwt.Claims.Should().Contain(c => c.Type == "email" && c.Value == email);
        jwt.Claims.Where(c => c.Type == "role").Select(c => c.Value).Should().BeEquivalentTo(roles);
    }

    [Fact]
    public void GenerateRefreshToken_ShouldCreateValidToken()
    {
        // Act
        var refreshToken = _jwtService.GenerateRefreshToken();

        // Assert
        refreshToken.Should().NotBeNullOrEmpty();
        refreshToken.Length.Should().BeGreaterThan(40);
        
        // Should be base64 encoded
        Action act = () => Convert.FromBase64String(refreshToken);
        act.Should().NotThrow();
    }

    [Fact]
    public void ValidateToken_WithValidToken_ShouldReturnPrincipal()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var email = "test@example.com";
        var roles = new[] { "User" };
        var token = _jwtService.GenerateToken(userId, email, roles);

        // Act
        var principal = _jwtService.ValidateToken(token);

        // Assert
        principal.Should().NotBeNull();
        principal.Identity.Should().BeOfType<ClaimsIdentity>();
        principal.Identity!.IsAuthenticated.Should().BeTrue();
        principal.FindFirst("sub")?.Value.Should().Be(userId.ToString());
        principal.FindFirst("email")?.Value.Should().Be(email);
    }

    [Fact]
    public void ValidateToken_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        var principal = _jwtService.ValidateToken(invalidToken);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_WithExpiredToken_ShouldReturnNull()
    {
        // Arrange
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(SecretKey);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim("sub", Guid.NewGuid().ToString()),
                new Claim("email", "test@example.com")
            }),
            Expires = DateTime.UtcNow.AddMinutes(-1), // Expired
            Issuer = Issuer,
            Audience = Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        // Act
        var principal = _jwtService.ValidateToken(tokenString);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void GetUserIdFromToken_WithValidToken_ShouldReturnUserId()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var token = _jwtService.GenerateToken(userId, "test@example.com", new[] { "User" });

        // Act
        var extractedUserId = _jwtService.GetUserIdFromToken(token);

        // Assert
        extractedUserId.Should().Be(userId);
    }

    [Fact]
    public void GetUserIdFromToken_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "invalid.token";

        // Act
        var userId = _jwtService.GetUserIdFromToken(invalidToken);

        // Assert
        userId.Should().BeNull();
    }

    [Fact]
    public void GetEmailFromToken_WithValidToken_ShouldReturnEmail()
    {
        // Arrange
        var email = "test@example.com";
        var token = _jwtService.GenerateToken(Guid.NewGuid(), email, new[] { "User" });

        // Act
        var extractedEmail = _jwtService.GetEmailFromToken(token);

        // Assert
        extractedEmail.Should().Be(email);
    }

    [Fact]
    public void GetRolesFromToken_WithValidToken_ShouldReturnRoles()
    {
        // Arrange
        var roles = new[] { "User", "Admin", "Moderator" };
        var token = _jwtService.GenerateToken(Guid.NewGuid(), "test@example.com", roles);

        // Act
        var extractedRoles = _jwtService.GetRolesFromToken(token);

        // Assert
        extractedRoles.Should().BeEquivalentTo(roles);
    }

    [Fact]
    public void IsTokenExpired_WithExpiredToken_ShouldReturnTrue()
    {
        // Arrange
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(SecretKey);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim("sub", Guid.NewGuid().ToString()) }),
            Expires = DateTime.UtcNow.AddMinutes(-1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        // Act
        var isExpired = _jwtService.IsTokenExpired(tokenString);

        // Assert
        isExpired.Should().BeTrue();
    }

    [Fact]
    public void IsTokenExpired_WithValidToken_ShouldReturnFalse()
    {
        // Arrange
        var token = _jwtService.GenerateToken(Guid.NewGuid(), "test@example.com", new[] { "User" });

        // Act
        var isExpired = _jwtService.IsTokenExpired(token);

        // Assert
        isExpired.Should().BeFalse();
    }
}