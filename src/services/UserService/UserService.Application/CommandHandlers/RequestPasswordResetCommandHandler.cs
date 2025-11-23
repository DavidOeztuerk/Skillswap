using CQRS.Handlers;
using UserService.Application.Commands;
using EventSourcing;
using Contracts.User.Responses;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using Core.Common.Exceptions;
using MassTransit;
using Events.Security.Authentication;

namespace UserService.Application.CommandHandlers;

public class RequestPasswordResetCommandHandler(
    IAuthRepository authRepository,
    IPublishEndpoint publishEndpoint,
    ILogger<RequestPasswordResetCommandHandler> logger)
    : BaseCommandHandler<RequestPasswordResetCommand, RequestPasswordResetResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<RequestPasswordResetResponse>> Handle(
        RequestPasswordResetCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var userInfo = await _authRepository.RequestPasswordReset(request.Email, cancellationToken);

            // Publish password reset email event if user exists
            if (userInfo.HasValue)
            {
                await _publishEndpoint.Publish(
                    new PasswordResetEmailEvent(
                        userInfo.Value.UserId,
                        userInfo.Value.Email,
                        userInfo.Value.ResetToken,
                        userInfo.Value.FirstName),
                    cancellationToken);

                Logger.LogInformation("Password reset email event published for {Email}", request.Email);
            }

            // Always return the same response for security (don't reveal if email exists)
            var response = new RequestPasswordResetResponse(
                true,
                "If an account with this email exists, you will receive password reset instructions.");

            Logger.LogInformation("Password reset requested for email {Email}", request.Email);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error requesting password reset for email {Email}", request.Email);
            return Error("An error occurred while processing your request. Please try again.", ErrorCodes.InternalError);
        }
    }
}