using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using EventSourcing;
using Events.Domain.User;
using Events.Notification;
using Contracts.User.Responses;
using Contracts.User.Responses.Auth;
using UserService.Domain.Enums;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using Core.Common.Exceptions;
using MassTransit;

namespace UserService.Application.CommandHandlers;

public class VerifyEmailCommandHandler(
    IAuthRepository authRepository,
    IPublishEndpoint publishEndpoint,
    ILogger<VerifyEmailCommandHandler> logger)
    : BaseCommandHandler<VerifyEmailCommand, VerifyEmailResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<VerifyEmailResponse>> Handle(
        VerifyEmailCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _authRepository.VerifyEmail(request.Email, request.VerificationToken, cancellationToken);

            if (!result.Success)
            {
                return Error("Invalid or expired verification token", ErrorCodes.TokenExpired);
            }

            // Publish Welcome Email event after successful verification
            if (result.UserId != null && result.Email != null && result.FirstName != null)
            {
                await _publishEndpoint.Publish(
                    new WelcomeEmailEvent(
                        result.UserId,
                        result.Email,
                        result.FirstName),
                    cancellationToken);

                Logger.LogInformation("Welcome email event published for {Email}", request.Email);
            }

            Logger.LogInformation("Email verified for user {Email}", request.Email);

            var response = new VerifyEmailResponse(true, "Email verified successfully");
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error verifying email for {Email}", request.Email);
            return Error("An error occurred while verifying email. Please try again.", ErrorCodes.InternalError);
        }
    }
}
