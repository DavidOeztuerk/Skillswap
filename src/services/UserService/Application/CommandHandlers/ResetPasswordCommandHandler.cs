using CQRS.Handlers;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;
using UserService.Domain.Events;
using EventSourcing;

namespace UserService.Application.CommandHandlers;

// ============================================================================
// RESET PASSWORD COMMAND HANDLER
// ============================================================================

public class ResetPasswordCommandHandler(
    UserDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<ResetPasswordCommandHandler> logger)
    : BaseCommandHandler<ResetPasswordCommand, ResetPasswordResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<ResetPasswordResponse>> Handle(
        ResetPasswordCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {

            var email = request.Email;
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == email
                                        && u.PasswordResetToken == request.ResetToken, cancellationToken);

            if (user == null || user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
            {
                return Error("Invalid or expired reset token");
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordChangedAt = DateTime.UtcNow;
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiresAt = null;
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

            await _eventPublisher.Publish(new PasswordResetCompletedDomainEvent(
                user.Id,
                user.Email), cancellationToken);

            Logger.LogInformation("Password reset completed for user {Email}", request.Email);

            var response = new ResetPasswordResponse(true, "Password reset successfully. Please login with your new password.");
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error resetting password for email {Email}", request.Email);
            return Error("An error occurred while resetting password. Please try again.");
        }
    }
}

