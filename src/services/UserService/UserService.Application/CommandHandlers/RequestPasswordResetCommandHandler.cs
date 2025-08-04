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

public class RequestPasswordResetCommandHandler(
    IAuthRepository authRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<RequestPasswordResetCommandHandler> logger)
    : BaseCommandHandler<RequestPasswordResetCommand, RequestPasswordResetResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<RequestPasswordResetResponse>> Handle(
        RequestPasswordResetCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            await _authRepository.RequestPasswordReset(request.Email, cancellationToken);

            var response = new RequestPasswordResetResponse(
                true, 
                "If an account with this email exists, you will receive password reset instructions.");

            Logger.LogInformation("Password reset requested for email {Email}", request.Email);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error requesting password reset for email {Email}", request.Email);
            return Error("An error occurred while processing your request. Please try again.");
        }
    }
}