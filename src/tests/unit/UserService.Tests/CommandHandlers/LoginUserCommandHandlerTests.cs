using FluentAssertions;
using MassTransit;
using Microsoft.Extensions.Logging;
using Moq;
using Testing;
using UserService.Application.CommandHandlers;
using UserService.Application.Commands;
using UserService.Domain.Models;
using Xunit;
using Bogus;
using Infrastructure.Security;
using UserService.Domain.Repositories;
using System.Threading.Tasks;
using System.Threading;

namespace UserService.Tests.CommandHandlers;

public class LoginUserCommandHandlerTests : BaseUnitTest
{
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly Mock<IJwtService> _mockJwtService;
    private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
    private readonly Mock<ILogger<LoginUserCommandHandler>> _mockLogger;
    private readonly LoginUserCommandHandler _handler;
    private readonly Faker _faker;

    public LoginUserCommandHandlerTests()
    {
        _mockUserRepository = new Mock<IUserRepository>();
        _mockJwtService = new Mock<IJwtService>();
        _mockPublishEndpoint = new Mock<IPublishEndpoint>();
        _mockLogger = new Mock<ILogger<LoginUserCommandHandler>>();
        _faker = new Faker();

        _handler = new LoginUserCommandHandler(
            _mockUserRepository.Object,
            _mockJwtService.Object,
            _mockPublishEndpoint.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task Handle_WithValidCredentials_ShouldReturnSuccess()
    {
        // Arrange
        var password = "Test@123456";
        var user = CreateTestUser(password);

        var command = new LoginUserCommand
        {
            Email = user.Email,
            Password = password
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(command.Email))
            .ReturnsAsync(user);

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string[]>()))
            .Returns("test-jwt-token");

        _mockJwtService.Setup(x => x.GenerateRefreshToken())
            .Returns("test-refresh-token");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Token.Should().Be("test-jwt-token");
        result.Data.RefreshToken.Should().Be("test-refresh-token");
        result.Data.User.Should().NotBeNull();
        result.Data.User.Id.Should().Be(user.Id);

        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserLoggedInIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithInvalidEmail_ShouldReturnFailure()
    {
        // Arrange
        var command = new LoginUserCommand
        {
            Email = _faker.Internet.Email(),
            Password = "Test@123456"
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(command.Email))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Invalid email or password");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserLoggedInIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithInvalidPassword_ShouldReturnFailure()
    {
        // Arrange
        var user = CreateTestUser("CorrectPassword123!");

        var command = new LoginUserCommand
        {
            Email = user.Email,
            Password = "WrongPassword123!"
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(command.Email))
            .ReturnsAsync(user);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Invalid email or password");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserLoggedInIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithBlockedUser_ShouldReturnFailure()
    {
        // Arrange
        var password = "Test@123456";
        var user = CreateTestUser(password);
        user.IsBlocked = true;
        user.BlockedAt = DateTime.UtcNow.AddHours(-1);
        user.BlockedReason = "Suspicious activity";

        var command = new LoginUserCommand
        {
            Email = user.Email,
            Password = password
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(command.Email))
            .ReturnsAsync(user);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("blocked");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserLoggedInIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithUnverifiedEmail_ShouldReturnFailure()
    {
        // Arrange
        var password = "Test@123456";
        var user = CreateTestUser(password);
        user.EmailConfirmed = false;

        var command = new LoginUserCommand
        {
            Email = user.Email,
            Password = password
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(command.Email))
            .ReturnsAsync(user);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("verify your email");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserLoggedInIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldUpdateLastLoginDate()
    {
        // Arrange
        var password = "Test@123456";
        var user = CreateTestUser(password);
        var originalLastLogin = user.LastLoginAt;

        var command = new LoginUserCommand
        {
            Email = user.Email,
            Password = password
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(command.Email))
            .ReturnsAsync(user);

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string[]>()))
            .Returns("test-jwt-token");

        _mockJwtService.Setup(x => x.GenerateRefreshToken())
            .Returns("test-refresh-token");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        user.LastLoginAt.Should().NotBe(originalLastLogin);
        user.LastLoginAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        _mockUserRepository.Verify(x => x.UpdateAsync(It.Is<User>(u => u.Id == user.Id)), Times.Once);
    }

    [Fact]
    public async Task Handle_WithTwoFactorEnabled_ShouldRequireTwoFactorCode()
    {
        // Arrange
        var password = "Test@123456";
        var user = CreateTestUser(password);
        user.TwoFactorEnabled = true;
        user.TwoFactorSecret = "TESTSECRET123";

        var command = new LoginUserCommand
        {
            Email = user.Email,
            Password = password
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(command.Email))
            .ReturnsAsync(user);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Two-factor");
        result.Data.Should().NotBeNull();
        result.Data!.RequiresTwoFactor.Should().BeTrue();
        result.Data.TwoFactorToken.Should().NotBeNullOrEmpty();

        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserLoggedInIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenRepositoryThrowsException_ShouldReturnFailure()
    {
        // Arrange
        var command = new LoginUserCommand
        {
            Email = _faker.Internet.Email(),
            Password = "Test@123456"
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("error");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserLoggedInIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private User CreateTestUser(string password)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            EmailConfirmed = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            LastLoginAt = DateTime.UtcNow.AddDays(-1)
        };

        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            Role = new Role { Id = Guid.NewGuid(), Name = "User" }
        });

        return user;
    }
}