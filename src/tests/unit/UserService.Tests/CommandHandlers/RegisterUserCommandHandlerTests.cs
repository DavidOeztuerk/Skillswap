using FluentAssertions;
using MassTransit;
using Microsoft.Extensions.Logging;
using Moq;
using Testing;
using UserService.Application.CommandHandlers;
using UserService.Application.Commands;
using UserService.Domain.Interfaces;
using UserService.Domain.Models;
using UserService.Infrastructure.Security;
using Xunit;
using Core.Events.Integration.User;
using Bogus;

namespace UserService.Tests.CommandHandlers;

public class RegisterUserCommandHandlerTests : BaseUnitTest
{
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly Mock<IJwtService> _mockJwtService;
    private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
    private readonly Mock<ILogger<RegisterUserCommandHandler>> _mockLogger;
    private readonly RegisterUserCommandHandler _handler;
    private readonly Faker _faker;

    public RegisterUserCommandHandlerTests()
    {
        _mockUserRepository = new Mock<IUserRepository>();
        _mockJwtService = new Mock<IJwtService>();
        _mockPublishEndpoint = new Mock<IPublishEndpoint>();
        _mockLogger = new Mock<ILogger<RegisterUserCommandHandler>>();
        _faker = new Faker();

        _handler = new RegisterUserCommandHandler(
            _mockUserRepository.Object,
            _mockJwtService.Object,
            _mockPublishEndpoint.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task Handle_WithValidData_ShouldCreateUserSuccessfully()
    {
        // Arrange
        var command = new RegisterUserCommand
        {
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            Password = "Test@123456"
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);
        
        _mockUserRepository.Setup(x => x.GetByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        _mockUserRepository.Setup(x => x.AddAsync(It.IsAny<User>()))
            .ReturnsAsync((User user) => user);

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
        result.Data.User.Email.Should().Be(command.Email);
        result.Data.User.Username.Should().Be(command.Username);

        _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>()), Times.Once);
        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserRegisteredIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithExistingEmail_ShouldReturnFailure()
    {
        // Arrange
        var command = new RegisterUserCommand
        {
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            Password = "Test@123456"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = command.Email,
            Username = "different-username"
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(command.Email))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("already registered");
        result.Data.Should().BeNull();

        _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>()), Times.Never);
        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserRegisteredIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithExistingUsername_ShouldReturnFailure()
    {
        // Arrange
        var command = new RegisterUserCommand
        {
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            Password = "Test@123456"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "different@email.com",
            Username = command.Username
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        _mockUserRepository.Setup(x => x.GetByUsernameAsync(command.Username))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("already taken");
        result.Data.Should().BeNull();

        _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>()), Times.Never);
        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserRegisteredIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenRepositoryThrowsException_ShouldReturnFailure()
    {
        // Arrange
        var command = new RegisterUserCommand
        {
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            Password = "Test@123456"
        };

        _mockUserRepository.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        _mockUserRepository.Setup(x => x.GetByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        _mockUserRepository.Setup(x => x.AddAsync(It.IsAny<User>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("error");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<UserRegisteredIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldHashPasswordCorrectly()
    {
        // Arrange
        var command = new RegisterUserCommand
        {
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            Password = "Test@123456"
        };

        User? capturedUser = null;

        _mockUserRepository.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        _mockUserRepository.Setup(x => x.GetByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        _mockUserRepository.Setup(x => x.AddAsync(It.IsAny<User>()))
            .Callback<User>(user => capturedUser = user)
            .ReturnsAsync((User user) => user);

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string[]>()))
            .Returns("test-jwt-token");

        _mockJwtService.Setup(x => x.GenerateRefreshToken())
            .Returns("test-refresh-token");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.PasswordHash.Should().NotBeEmpty();
        capturedUser.PasswordHash.Should().NotBe(command.Password);
        BCrypt.Net.BCrypt.Verify(command.Password, capturedUser.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task Handle_ShouldSetDefaultRoleAsUser()
    {
        // Arrange
        var command = new RegisterUserCommand
        {
            FirstName = _faker.Name.FirstName(),
            LastName = _faker.Name.LastName(),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            Password = "Test@123456"
        };

        User? capturedUser = null;

        _mockUserRepository.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        _mockUserRepository.Setup(x => x.GetByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        _mockUserRepository.Setup(x => x.AddAsync(It.IsAny<User>()))
            .Callback<User>(user => capturedUser = user)
            .ReturnsAsync((User user) => user);

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string[]>()))
            .Returns("test-jwt-token");

        _mockJwtService.Setup(x => x.GenerateRefreshToken())
            .Returns("test-refresh-token");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.UserRoles.Should().ContainSingle();
        capturedUser.UserRoles.First().Role.Name.Should().Be("User");
    }
}