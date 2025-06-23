using CQRS.Handlers;
using Infrastructure.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;
using UserService.Domain.Events;
using EventSourcing;

namespace UserService.Application.CommandHandlers;

// ============================================================================
// REQUEST PASSWORD RESET COMMAND HANDLER
// ============================================================================

public class RequestPasswordResetCommandHandler(
    UserDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<RequestPasswordResetCommandHandler> logger)
    : BaseCommandHandler<RequestPasswordResetCommand, RequestPasswordResetResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<RequestPasswordResetResponse>> Handle(
        RequestPasswordResetCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

            // Always return success for security reasons (don't reveal if email exists)
            var response = new RequestPasswordResetResponse(
                true, 
                "If an account with this email exists, you will receive password reset instructions.");

            if (user == null)
            {
                Logger.LogInformation("Password reset requested for non-existent email {Email}", request.Email);
                return Success(response);
            }

            // Generate reset token
            user.PasswordResetToken = Guid.NewGuid().ToString("N");
            user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1); // 1 hour expiry
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event for email sending
            await _eventPublisher.Publish(new PasswordResetRequestedDomainEvent(
                user.Id,
                user.Email,
                user.PasswordResetToken,
                user.FirstName), cancellationToken);

            Logger.LogInformation("Password reset requested for user {Email}", request.Email);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error requesting password reset for email {Email}", request.Email);
            return Error("An error occurred while processing your request. Please try again.");
        }
    }
}