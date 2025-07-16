using UserService;
using Testing;
using FluentAssertions;
using Xunit;
using System.Net;
using System.Net.Http.Json;
using Contracts.Requests;
using Contracts.Responses;

namespace UserService.Tests;

/// <summary>
/// Integration tests for UserService API endpoints
/// </summary>
public class UserServiceIntegrationTest : BaseIntegrationTest<Program, UserDbContext>
{
    public UserServiceIntegrationTest(IntegrationTestWebAppFactory<Program, UserDbContext> factory) 
        : base(factory)
    {
    }

    [Fact]
    public async Task Register_WithValidData_ShouldReturnSuccess()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "Test123!@#"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/users/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<RegisterResponse>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Token.Should().NotBeNullOrEmpty();
        result.User.Should().NotBeNull();
        result.User!.Email.Should().Be(request.Email);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "invalid-email",
            Password = "Test123!@#"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/users/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnSuccess()
    {
        // Arrange
        await RegisterTestUser();
        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "Test123!@#"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/users/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Token.Should().NotBeNullOrEmpty();
        result.User.Should().NotBeNull();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword123!"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/users/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetProfile_WithValidToken_ShouldReturnUserProfile()
    {
        // Arrange
        var token = await RegisterTestUserAndGetToken();
        Client.AddJwtToken(token);

        // Act
        var response = await Client.GetAsync("/api/users/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<GetUserProfileResponse>();
        result.Should().NotBeNull();
        result!.User.Should().NotBeNull();
        result.User!.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task GetProfile_WithoutToken_ShouldReturnUnauthorized()
    {
        // Act
        var response = await Client.GetAsync("/api/users/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ChangePassword_WithValidData_ShouldReturnSuccess()
    {
        // Arrange
        var token = await RegisterTestUserAndGetToken();
        Client.AddJwtToken(token);
        
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "Test123!@#",
            NewPassword = "NewPassword123!@#"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/users/change-password", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChangePassword_WithWrongCurrentPassword_ShouldReturnBadRequest()
    {
        // Arrange
        var token = await RegisterTestUserAndGetToken();
        Client.AddJwtToken(token);
        
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "WrongPassword123!@#",
            NewPassword = "NewPassword123!@#"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/users/change-password", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private async Task<string> RegisterTestUserAndGetToken()
    {
        var request = new RegisterRequest
        {
            FirstName = "Test",
            LastName = "User",
            Email = "test@example.com",
            Password = "Test123!@#"
        };

        var response = await Client.PostAsJsonAsync("/api/users/register", request);
        var result = await response.Content.ReadFromJsonAsync<RegisterResponse>();
        
        return result!.Token;
    }

    private async Task RegisterTestUser()
    {
        await RegisterTestUserAndGetToken();
    }
}