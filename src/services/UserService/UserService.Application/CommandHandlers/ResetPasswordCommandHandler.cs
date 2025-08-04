using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Application.Commands;
using EventSourcing;
using Events.Domain.User;
using Contracts.User.Responses;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using CQRS.Models;

namespace UserService.Application.CommandHandlers;

public class ResetPasswordCommandHandler(
    IAuthRepository authRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<ResetPasswordCommandHandler> logger)
    : BaseCommandHandler<ResetPasswordCommand, ResetPasswordResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<ResetPasswordResponse>> Handle(
        ResetPasswordCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _authRepository.ResetPassword(
                request.Email, 
                request.ResetToken, 
                request.NewPassword, 
                cancellationToken);

            if (!result)
            {
                return Error("Invalid or expired reset token. Please request a new password reset.");
            }

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

