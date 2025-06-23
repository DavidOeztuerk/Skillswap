using CQRS.Handlers;
using Infrastructure.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;
using UserService.Domain.Events;
using EventSourcing;

namespace UserService.Application.CommandHandlers;

// ============================================================================
// VERIFY EMAIL COMMAND HANDLER
// ============================================================================

public class VerifyEmailCommandHandler(
    UserDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<VerifyEmailCommandHandler> logger)
    : BaseCommandHandler<VerifyEmailCommand, VerifyEmailResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<VerifyEmailResponse>> Handle(
        VerifyEmailCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email 
                                        && u.EmailVerificationToken == request.VerificationToken, cancellationToken);

            if (user == null || user.EmailVerificationTokenExpiresAt < DateTime.UtcNow)
            {
                return Error("Invalid or expired verification token");
            }

            if (user.EmailVerified)
            {
                return Error("Email is already verified");
            }

            // Verify email
            user.EmailVerified = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationTokenExpiresAt = null;
            user.AccountStatus = "Active";
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new EmailVerifiedDomainEvent(
                user.Id,
                user.Email), cancellationToken);

            Logger.LogInformation("Email verified for user {Email}", request.Email);

            var response = new VerifyEmailResponse(true, "Email verified successfully");
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error verifying email for {Email}", request.Email);
            return Error("An error occurred while verifying email. Please try again.");
        }
    }
}
