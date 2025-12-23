using CQRS.Handlers;
using UserService.Application.Commands;
using CQRS.Models;
using Contracts.User.Responses.Auth;
using Contracts.Events;
using UserService.Domain.Repositories;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace UserService.Application.CommandHandlers;

public class RegisterUserCommandHandler(
    IAuthRepository authRepository,
    IPublishEndpoint publishEndpoint,
    ILogger<RegisterUserCommandHandler> logger)
    : BaseCommandHandler<RegisterUserCommand, RegisterResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<RegisterResponse>> Handle(
        RegisterUserCommand request,
        CancellationToken cancellationToken)
    {
        var response = await _authRepository.RegisterUserWithTokens(
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            request.UserName,
            cancellationToken);

        // Publish both UserRegisteredEvent (audit) and UserEmailVerificationRequestedEvent (email trigger)
        if (!string.IsNullOrEmpty(response.VerificationCode))
        {
            // 1. Publish UserRegisteredEvent for audit logs and analytics
            await _publishEndpoint.Publish(
                new UserRegisteredEvent(
                    response.UserInfo.UserId.ToString(),
                    response.UserInfo.Email,
                    response.UserInfo.UserName,
                    response.UserInfo.FirstName,
                    response.UserInfo.LastName,
                    DateTime.UtcNow),
                cancellationToken);

            // 2. Publish UserEmailVerificationRequestedEvent to trigger email sending
            // Note: Verification code is temporary (expires in 3 days) and sent via secure RabbitMQ
            await _publishEndpoint.Publish(
                new UserEmailVerificationRequestedEvent(
                    response.UserInfo.UserId.ToString(),
                    response.UserInfo.Email,
                    response.VerificationCode,
                    response.UserInfo.UserName,
                    DateTime.UtcNow.AddDays(3), // ExpiresAt matches AuthRepository setting
                    DateTime.UtcNow),
                cancellationToken);

            Logger.LogInformation(
                "User {Email} registered successfully. Verification email event published",
                request.Email);
        }

        return Success(response, "User registered successfully. Please check your email for verification.");
    }
}
