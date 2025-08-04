using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using EventSourcing;
using Events.Domain.User;
using Contracts.User.Responses;
using Contracts.User.Responses.Auth;
using UserService.Domain.Enums;
using Microsoft.Extensions.Logging;
using CQRS.Models;

namespace UserService.Application.CommandHandlers;

public class VerifyEmailCommandHandler(
    IAuthRepository authRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<VerifyEmailCommandHandler> logger)
    : BaseCommandHandler<VerifyEmailCommand, VerifyEmailResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<VerifyEmailResponse>> Handle(
        VerifyEmailCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _authRepository.VerifyEmail(request.Email, request.VerificationToken, cancellationToken);

            if (!result)
            {
                return Error("Invalid or expired verification token");
            }

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
