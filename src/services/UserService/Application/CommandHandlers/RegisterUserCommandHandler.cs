using CQRS.Handlers;
using CQRS.Interfaces;
using Events;
using Infrastructure.Models;
using Infrastructure.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;
using UserService.Domain.Events;
using UserService.Domain.Models;

namespace UserService.Application.CommandHandlers;

// ============================================================================
// REGISTER USER COMMAND HANDLER
// ============================================================================

public class RegisterUserCommandHandler(
    UserDbContext dbContext,
    IEnhancedJwtService jwtService,
    IPublisher publisher,
    ILogger<RegisterUserCommandHandler> logger)
    : BaseCommandHandler<RegisterUserCommand, RegisterUserResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IEnhancedJwtService _jwtService = jwtService;
    private readonly IPublisher _publisher = publisher;

    public override async Task<ApiResponse<RegisterUserResponse>> Handle(
        RegisterUserCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Check if email already exists
            var existingUser = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

            if (existingUser != null)
            {
                return Error("Email address is already registered");
            }

            // Create new user
            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                AccountStatus = "PendingVerification",
                EmailVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            // Add default role
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                Role = Roles.User,
                AssignedAt = DateTime.UtcNow
            });

            // Generate email verification token
            user.EmailVerificationToken = GenerateVerificationToken();
            user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddDays(1);

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Generate JWT tokens
            var userClaims = new UserClaims
            {
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = new List<string> { Roles.User },
                EmailVerified = false,
                AccountStatus = user.AccountStatus
            };

            var tokens = await _jwtService.GenerateTokenAsync(userClaims);

            // Store refresh token
            var refreshToken = new RefreshToken
            {
                Token = tokens.RefreshToken,
                UserId = user.Id,
                ExpiryDate = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };

            _dbContext.RefreshTokens.Add(refreshToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _publisher.Publish(new UserRegisteredEvent(
                user.Email,
                user.FirstName,
                user.LastName), cancellationToken);

            // Publish verification email event
            await _publisher.Publish(new EmailVerificationRequestedDomainEvent(
                user.Id,
                user.Email,
                user.EmailVerificationToken!,
                user.FirstName), cancellationToken);

            Logger.LogInformation("User {Email} registered successfully with ID {UserId}",
                request.Email, user.Id);

            var response = new RegisterUserResponse(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                tokens,
                true);

            return Success(response, "User registered successfully. Please check your email for verification.");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error registering user {Email}", request.Email);
            return Error("An error occurred during registration. Please try again.");
        }
    }

    private static string GenerateVerificationToken()
    {
        return Guid.NewGuid().ToString("N");
    }
}


public record UserRegisteredEvent(
    string Email,
    string FirstName,
    string LastName) : DomainEvent;
