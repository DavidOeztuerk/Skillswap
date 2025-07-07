using CQRS.Handlers;
using Infrastructure.Models;
using EventSourcing;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;
using UserService.Domain.Events;

namespace UserService.Application.CommandHandlers;

// ============================================================================
// CHANGE PASSWORD COMMAND HANDLER
// ============================================================================

public class ChangePasswordCommandHandler(
    UserDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<ChangePasswordCommandHandler> logger)
    : BaseCommandHandler<ChangePasswordCommand, ChangePasswordResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<ChangePasswordResponse>> Handle(
        ChangePasswordCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found");
            }

            // Verify current password
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                Logger.LogWarning("Invalid current password attempt for user {UserId}", request.UserId);
                return Error("Current password is incorrect");
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordChangedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            // Revoke all existing refresh tokens for security
            var refreshTokens = await _dbContext.RefreshTokens
                .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var token in refreshTokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event

            await _eventPublisher.Publish(new PasswordChangedDomainEvent(
                user.Id,
                user.Email), cancellationToken);

            Logger.LogInformation("Password changed successfully for user {UserId}", request.UserId);

            var response = new ChangePasswordResponse(true, DateTime.UtcNow);
            return Success(response, "Password changed successfully. Please login again.");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error changing password for user {UserId}", request.UserId);
            return Error("An error occurred while changing password. Please try again.");
        }
    }
}
