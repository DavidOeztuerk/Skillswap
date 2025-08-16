using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Testing;
using UserService.Infrastructure;
using Xunit;
using Contracts.User.Requests;
using Contracts.User.Responses;
using Core.CQRS.Models;
using Microsoft.EntityFrameworkCore;
using Bogus;

namespace UserService.IntegrationTests;

[Collection("Database")]
public class AuthControllerIntegrationTests : BaseIntegrationTest<Program, UserDbContext>
{
    private readonly Faker _faker;

    public AuthControllerIntegrationTests(IntegrationTestWebAppFactory<Program, UserDbContext> factory) 
        : base(factory)
    {
        _faker = new Faker();
    }

    [Fact]
    public async Task Register_WithValidData_ShouldCreateNewUser()
    {
        // Arrange
        var request = new RegisterUserRequest
        {
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            Password = "Test@123456",
            ConfirmPassword = "Test@123456"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data.Should().NotBeNull();
        content.Data!.Token.Should().NotBeNullOrEmpty();
        content.Data.RefreshToken.Should().NotBeNullOrEmpty();
        content.Data.User.Should().NotBeNull();
        content.Data.User.Email.Should().Be(request.Email);

        // Verify user was created in database
        await ExecuteDbContextAsync(async db =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            user.Should().NotBeNull();
            user!.FirstName.Should().Be(request.FirstName);
            user.LastName.Should().Be(request.LastName);
            user.Username.Should().Be(request.Username);
            user.EmailConfirmed.Should().BeFalse();
        });
    }

    [Fact]
    public async Task Register_WithExistingEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var email = _faker.Internet.Email();
        
        // Create existing user
        await ExecuteDbContextAsync(async db =>
        {
            var existingUser = new UserService.Domain.Models.User
            {
                Id = Guid.NewGuid(),
                FirstName = _faker.Name.FirstName(),
                LastName = _faker.Name.LastName(),
                Email = email,
                Username = _faker.Internet.UserName(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123456"),
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(existingUser);
            await db.SaveChangesAsync();
        });

        var request = new RegisterUserRequest
        {
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = email, // Same email
            Username = _faker.Internet.UserName(),
            Password = "Test@123456",
            ConfirmPassword = "Test@123456"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeFalse();
        content.Message.Should().Contain("already registered");
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnToken()
    {
        // Arrange
        var email = _faker.Internet.Email();
        var password = "Test@123456";
        
        // Create user
        await ExecuteDbContextAsync(async db =>
        {
            var user = new UserService.Domain.Models.User
            {
                Id = Guid.NewGuid(),
                FirstName = _faker.Name.FirstName(),
                LastName = _faker.Name.LastName(),
                Email = email,
                Username = _faker.Internet.UserName(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        var request = new LoginUserRequest
        {
            Email = email,
            Password = password
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data.Should().NotBeNull();
        content.Data!.Token.Should().NotBeNullOrEmpty();
        content.Data.RefreshToken.Should().NotBeNullOrEmpty();
        content.Data.User.Email.Should().Be(email);
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ShouldReturnUnauthorized()
    {
        // Arrange
        var email = _faker.Internet.Email();
        
        // Create user
        await ExecuteDbContextAsync(async db =>
        {
            var user = new UserService.Domain.Models.User
            {
                Id = Guid.NewGuid(),
                FirstName = _faker.Name.FirstName(),
                LastName = _faker.Name.LastName(),
                Email = email,
                Username = _faker.Internet.UserName(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!"),
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        var request = new LoginUserRequest
        {
            Email = email,
            Password = "WrongPassword123!"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeFalse();
        content.Message.Should().Contain("Invalid email or password");
    }

    [Fact]
    public async Task RefreshToken_WithValidToken_ShouldReturnNewTokens()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var refreshToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        
        // Create user with refresh token
        await ExecuteDbContextAsync(async db =>
        {
            var user = new UserService.Domain.Models.User
            {
                Id = userId,
                FirstName = _faker.Name.FirstName(),
                LastName = _faker.Name.LastName(),
                Email = _faker.Internet.Email(),
                Username = _faker.Internet.UserName(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123456"),
                RefreshToken = refreshToken,
                RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7),
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        var request = new RefreshTokenRequest
        {
            UserId = userId,
            RefreshToken = refreshToken
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/refresh", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data.Should().NotBeNull();
        content.Data!.Token.Should().NotBeNullOrEmpty();
        content.Data.RefreshToken.Should().NotBeNullOrEmpty();
        content.Data.RefreshToken.Should().NotBe(refreshToken); // Should be a new token
    }

    [Fact]
    public async Task ChangePassword_WithValidCurrentPassword_ShouldSucceed()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var currentPassword = "OldPassword123!";
        var newPassword = "NewPassword123!";
        
        // Create user
        await ExecuteDbContextAsync(async db =>
        {
            var user = new UserService.Domain.Models.User
            {
                Id = userId,
                FirstName = _faker.Name.FirstName(),
                LastName = _faker.Name.LastName(),
                Email = _faker.Internet.Email(),
                Username = _faker.Internet.UserName(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(currentPassword),
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        SetTestAuthenticationHeader(userId.ToString(), new[] { "User" });

        var request = new ChangePasswordRequest
        {
            CurrentPassword = currentPassword,
            NewPassword = newPassword,
            ConfirmNewPassword = newPassword
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/change-password", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<bool>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data.Should().BeTrue();

        // Verify password was changed
        await ExecuteDbContextAsync(async db =>
        {
            var user = await db.Users.FindAsync(userId);
            user.Should().NotBeNull();
            BCrypt.Net.BCrypt.Verify(newPassword, user!.PasswordHash).Should().BeTrue();
            BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash).Should().BeFalse();
        });
    }

    [Fact]
    public async Task RequestPasswordReset_WithExistingEmail_ShouldSendResetToken()
    {
        // Arrange
        var email = _faker.Internet.Email();
        
        // Create user
        await ExecuteDbContextAsync(async db =>
        {
            var user = new UserService.Domain.Models.User
            {
                Id = Guid.NewGuid(),
                FirstName = _faker.Name.FirstName(),
                LastName = _faker.Name.LastName(),
                Email = email,
                Username = _faker.Internet.UserName(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123456"),
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        var request = new RequestPasswordResetRequest
        {
            Email = email
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/request-password-reset", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<bool>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Message.Should().Contain("reset instructions");

        // Verify reset token was set
        await ExecuteDbContextAsync(async db =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            user.Should().NotBeNull();
            user!.PasswordResetToken.Should().NotBeNullOrEmpty();
            user.PasswordResetTokenExpiry.Should().BeAfter(DateTime.UtcNow);
        });
    }
}