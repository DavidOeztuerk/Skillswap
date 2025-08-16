using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Testing;
using UserService.Application.QueryHandlers;
using UserService.Application.Queries;
using UserService.Domain.Interfaces;
using UserService.Domain.Models;
using Xunit;
using Bogus;

namespace UserService.Tests.QueryHandlers;

public class GetUserProfileQueryHandlerTests : BaseUnitTest
{
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly Mock<ILogger<GetUserProfileQueryHandler>> _mockLogger;
    private readonly GetUserProfileQueryHandler _handler;
    private readonly Faker _faker;

    public GetUserProfileQueryHandlerTests()
    {
        _mockUserRepository = new Mock<IUserRepository>();
        _mockLogger = new Mock<ILogger<GetUserProfileQueryHandler>>();
        _faker = new Faker();

        _handler = new GetUserProfileQueryHandler(
            _mockUserRepository.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task Handle_WithExistingUser_ShouldReturnUserProfile()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            Bio = _faker.Lorem.Paragraph(),
            AvatarUrl = _faker.Internet.Avatar(),
            EmailConfirmed = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            LastLoginAt = DateTime.UtcNow.AddHours(-2)
        };

        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            Role = new Role { Id = Guid.NewGuid(), Name = "User" }
        });

        var query = new GetUserProfileQuery { UserId = user.Id };

        _mockUserRepository.Setup(x => x.GetByIdAsync(user.Id))
            .ReturnsAsync(user);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Id.Should().Be(user.Id);
        result.Data.FirstName.Should().Be(user.FirstName);
        result.Data.LastName.Should().Be(user.LastName);
        result.Data.Email.Should().Be(user.Email);
        result.Data.Username.Should().Be(user.Username);
        result.Data.Bio.Should().Be(user.Bio);
        result.Data.AvatarUrl.Should().Be(user.AvatarUrl);
        result.Data.Roles.Should().ContainSingle();
        result.Data.Roles.First().Should().Be("User");
    }

    [Fact]
    public async Task Handle_WithNonExistentUser_ShouldReturnNotFound()
    {
        // Arrange
        var query = new GetUserProfileQuery { UserId = Guid.NewGuid() };

        _mockUserRepository.Setup(x => x.GetByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("User not found");
        result.Data.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithInactiveUser_ShouldReturnUserMarkedAsInactive()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            IsActive = false, // Inactive user
            DeactivatedAt = DateTime.UtcNow.AddDays(-5),
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        var query = new GetUserProfileQuery { UserId = user.Id };

        _mockUserRepository.Setup(x => x.GetByIdAsync(user.Id))
            .ReturnsAsync(user);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WithMultipleRoles_ShouldReturnAllRoles()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            CreatedAt = DateTime.UtcNow
        };

        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            Role = new Role { Id = Guid.NewGuid(), Name = "User" }
        });
        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            Role = new Role { Id = Guid.NewGuid(), Name = "Moderator" }
        });
        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            Role = new Role { Id = Guid.NewGuid(), Name = "Admin" }
        });

        var query = new GetUserProfileQuery { UserId = user.Id };

        _mockUserRepository.Setup(x => x.GetByIdAsync(user.Id))
            .ReturnsAsync(user);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Roles.Should().HaveCount(3);
        result.Data.Roles.Should().Contain("User");
        result.Data.Roles.Should().Contain("Moderator");
        result.Data.Roles.Should().Contain("Admin");
    }

    [Fact]
    public async Task Handle_WhenRepositoryThrowsException_ShouldReturnFailure()
    {
        // Arrange
        var query = new GetUserProfileQuery { UserId = Guid.NewGuid() };

        _mockUserRepository.Setup(x => x.GetByIdAsync(It.IsAny<Guid>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("error");
        result.Data.Should().BeNull();

        _mockLogger.Verify(x => x.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error getting user profile")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithNullQuery_ShouldReturnFailure()
    {
        // Arrange
        var query = new GetUserProfileQuery { UserId = Guid.Empty };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Invalid user ID");
        result.Data.Should().BeNull();
    }

    [Fact]
    public async Task Handle_ShouldNotReturnSensitiveData()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            PasswordHash = "SensitivePasswordHash",
            RefreshToken = "SensitiveRefreshToken",
            TwoFactorSecret = "SensitiveTwoFactorSecret",
            PasswordResetToken = "SensitiveResetToken",
            EmailVerificationToken = "SensitiveVerificationToken",
            CreatedAt = DateTime.UtcNow
        };

        var query = new GetUserProfileQuery { UserId = user.Id };

        _mockUserRepository.Setup(x => x.GetByIdAsync(user.Id))
            .ReturnsAsync(user);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        
        // Ensure sensitive data is not exposed
        result.Data!.Should().NotBeNull();
        var json = System.Text.Json.JsonSerializer.Serialize(result.Data);
        json.Should().NotContain("PasswordHash");
        json.Should().NotContain("RefreshToken");
        json.Should().NotContain("TwoFactorSecret");
        json.Should().NotContain("PasswordResetToken");
        json.Should().NotContain("EmailVerificationToken");
    }
}