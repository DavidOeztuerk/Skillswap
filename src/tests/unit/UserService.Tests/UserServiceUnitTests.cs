//using UserService.Application.Commands;
//using UserService.Application.Queries;
//using UserService.Application.CommandHandlers;
//using UserService.Application.QueryHandlers;
//using UserService.Domain.Entities;
//using Testing;
//using FluentAssertions;
//using Xunit;
//using Microsoft.EntityFrameworkCore;
//using Moq;
//using Infrastructure.Security;
//using Microsoft.Extensions.Logging;

//namespace UserService.Tests;

///// <summary>
///// Unit tests for UserService command and query handlers
///// </summary>
//public class UserServiceUnitTests : BaseUnitTest
//{
//    private readonly Mock<IJwtTokenGenerator> _mockJwtTokenGenerator;
//    private readonly Mock<ILogger<RegisterUserCommandHandler>> _mockLogger;

//    public UserServiceUnitTests()
//    {
//        _mockJwtTokenGenerator = new Mock<IJwtTokenGenerator>();
//        _mockLogger = new Mock<ILogger<RegisterUserCommandHandler>>();
//    }

//    [Fact]
//    public async Task RegisterUserCommandHandler_WithValidData_ShouldCreateUser()
//    {
//        // Arrange
//        using var context = CreateInMemoryDbContext<UserDbContext>();
//        var handler = new RegisterUserCommandHandler(context, _mockJwtTokenGenerator.Object, _mockLogger.Object);
        
//        var command = new RegisterUserCommand
//        {
//            FirstName = "John",
//            LastName = "Doe",
//            Email = "john.doe@example.com",
//            Password = "Test123!@#"
//        };

//        _mockJwtTokenGenerator.Setup(x => x.GenerateToken(It.IsAny<User>()))
//            .Returns("test-jwt-token");

//        // Act
//        var result = await handler.Handle(command, CancellationToken.None);

//        // Assert
//        result.Should().NotBeNull();
//        result.Success.Should().BeTrue();
//        result.Token.Should().Be("test-jwt-token");
//        result.User.Should().NotBeNull();
//        result.User!.Email.Should().Be(command.Email);

//        // Verify user was saved to database
//        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == command.Email);
//        user.Should().NotBeNull();
//        user!.FirstName.Should().Be(command.FirstName);
//        user.LastName.Should().Be(command.LastName);
//    }

//    [Fact]
//    public async Task RegisterUserCommandHandler_WithExistingEmail_ShouldReturnFailure()
//    {
//        // Arrange
//        using var context = CreateInMemoryDbContext<UserDbContext>();
//        var handler = new RegisterUserCommandHandler(context, _mockJwtTokenGenerator.Object, _mockLogger.Object);

//        // Create existing user
//        var existingUser = new User
//        {
//            Id = Guid.NewGuid(),
//            FirstName = "Existing",
//            LastName = "User",
//            Email = "existing@example.com",
//            PasswordHash = "hash",
//            CreatedAt = DateTime.UtcNow
//        };
//        context.Users.Add(existingUser);
//        await context.SaveChangesAsync();

//        var command = new RegisterUserCommand
//        {
//            FirstName = "John",
//            LastName = "Doe",
//            Email = "existing@example.com",
//            Password = "Test123!@#"
//        };

//        // Act
//        var result = await handler.Handle(command, CancellationToken.None);

//        // Assert
//        result.Should().NotBeNull();
//        result.Success.Should().BeFalse();
//        result.Error.Should().Contain("already exists");
//    }

//    [Fact]
//    public async Task LoginUserCommandHandler_WithValidCredentials_ShouldReturnSuccess()
//    {
//        // Arrange
//        using var context = CreateInMemoryDbContext<UserDbContext>();
//        var handler = new LoginUserCommandHandler(context, _mockJwtTokenGenerator.Object, _mockLogger.Object);

//        // Create test user
//        var user = new User
//        {
//            Id = Guid.NewGuid(),
//            FirstName = "Test",
//            LastName = "User",
//            Email = "test@example.com",
//            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!@#"),
//            CreatedAt = DateTime.UtcNow
//        };
//        context.Users.Add(user);
//        await context.SaveChangesAsync();

//        var command = new LoginUserCommand
//        {
//            Email = "test@example.com",
//            Password = "Test123!@#"
//        };

//        _mockJwtTokenGenerator.Setup(x => x.GenerateToken(It.IsAny<User>()))
//            .Returns("test-jwt-token");

//        // Act
//        var result = await handler.Handle(command, CancellationToken.None);

//        // Assert
//        result.Should().NotBeNull();
//        result.Success.Should().BeTrue();
//        result.Token.Should().Be("test-jwt-token");
//        result.User.Should().NotBeNull();
//        result.User!.Email.Should().Be(command.Email);
//    }

//    [Fact]
//    public async Task LoginUserCommandHandler_WithInvalidCredentials_ShouldReturnFailure()
//    {
//        // Arrange
//        using var context = CreateInMemoryDbContext<UserDbContext>();
//        var handler = new LoginUserCommandHandler(context, _mockJwtTokenGenerator.Object, _mockLogger.Object);

//        var command = new LoginUserCommand
//        {
//            Email = "nonexistent@example.com",
//            Password = "WrongPassword"
//        };

//        // Act
//        var result = await handler.Handle(command, CancellationToken.None);

//        // Assert
//        result.Should().NotBeNull();
//        result.Success.Should().BeFalse();
//        result.Error.Should().Contain("Invalid credentials");
//    }

//    [Fact]
//    public async Task GetUserProfileQueryHandler_WithValidUserId_ShouldReturnUser()
//    {
//        // Arrange
//        using var context = CreateInMemoryDbContext<UserDbContext>();
//        var handler = new GetUserProfileQueryHandler(context, _mockLogger.Object);

//        var userId = Guid.NewGuid();
//        var user = new User
//        {
//            Id = userId,
//            FirstName = "Test",
//            LastName = "User",
//            Email = "test@example.com",
//            PasswordHash = "hash",
//            CreatedAt = DateTime.UtcNow
//        };
//        context.Users.Add(user);
//        await context.SaveChangesAsync();

//        var query = new GetUserProfileQuery { UserId = userId };

//        // Act
//        var result = await handler.Handle(query, CancellationToken.None);

//        // Assert
//        result.Should().NotBeNull();
//        result.User.Should().NotBeNull();
//        result.User!.Id.Should().Be(userId);
//        result.User.Email.Should().Be("test@example.com");
//    }

//    [Fact]
//    public async Task GetUserProfileQueryHandler_WithInvalidUserId_ShouldReturnNull()
//    {
//        // Arrange
//        using var context = CreateInMemoryDbContext<UserDbContext>();
//        var handler = new GetUserProfileQueryHandler(context, _mockLogger.Object);

//        var query = new GetUserProfileQuery { UserId = Guid.NewGuid() };

//        // Act
//        var result = await handler.Handle(query, CancellationToken.None);

//        // Assert
//        result.Should().NotBeNull();
//        result.User.Should().BeNull();
//    }

//    [Fact]
//    public async Task ChangePasswordCommandHandler_WithValidData_ShouldUpdatePassword()
//    {
//        // Arrange
//        using var context = CreateInMemoryDbContext<UserDbContext>();
//        var handler = new ChangePasswordCommandHandler(context, _mockLogger.Object);

//        var userId = Guid.NewGuid();
//        var user = new User
//        {
//            Id = userId,
//            FirstName = "Test",
//            LastName = "User",
//            Email = "test@example.com",
//            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPassword123!@#"),
//            CreatedAt = DateTime.UtcNow
//        };
//        context.Users.Add(user);
//        await context.SaveChangesAsync();

//        var command = new ChangePasswordCommand
//        {
//            UserId = userId,
//            CurrentPassword = "OldPassword123!@#",
//            NewPassword = "NewPassword123!@#"
//        };

//        // Act
//        var result = await handler.Handle(command, CancellationToken.None);

//        // Assert
//        result.Should().NotBeNull();
//        result.Success.Should().BeTrue();

//        // Verify password was updated
//        var updatedUser = await context.Users.FindAsync(userId);
//        updatedUser.Should().NotBeNull();
//        BCrypt.Net.BCrypt.Verify("NewPassword123!@#", updatedUser!.PasswordHash).Should().BeTrue();
//    }

//    [Fact]
//    public async Task ChangePasswordCommandHandler_WithWrongCurrentPassword_ShouldReturnFailure()
//    {
//        // Arrange
//        using var context = CreateInMemoryDbContext<UserDbContext>();
//        var handler = new ChangePasswordCommandHandler(context, _mockLogger.Object);

//        var userId = Guid.NewGuid();
//        var user = new User
//        {
//            Id = userId,
//            FirstName = "Test",
//            LastName = "User",
//            Email = "test@example.com",
//            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPassword123!@#"),
//            CreatedAt = DateTime.UtcNow
//        };
//        context.Users.Add(user);
//        await context.SaveChangesAsync();

//        var command = new ChangePasswordCommand
//        {
//            UserId = userId,
//            CurrentPassword = "WrongPassword123!@#",
//            NewPassword = "NewPassword123!@#"
//        };

//        // Act
//        var result = await handler.Handle(command, CancellationToken.None);

//        // Assert
//        result.Should().NotBeNull();
//        result.Success.Should().BeFalse();
//        result.Error.Should().Contain("Current password is incorrect");
//    }
//}