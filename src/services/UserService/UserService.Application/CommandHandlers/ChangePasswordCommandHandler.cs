using CQRS.Handlers;
using EventSourcing;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using Core.Common.Exceptions;
using Core.Common;

namespace UserService.Application.CommandHandlers;

public class ChangePasswordCommandHandler(
    IUserProfileRepository userProfileRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<ChangePasswordCommandHandler> logger)
    : BaseCommandHandler<ChangePasswordCommand, ChangePasswordResponse>(logger)
{
    private readonly IUserProfileRepository _userProfileRepository = userProfileRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<ChangePasswordResponse>> Handle(
        ChangePasswordCommand request,
        CancellationToken cancellationToken)
    {
        if (request.UserId is null) throw new BusinessRuleViolationException("ERR_1002", "UserIdRequired", "UserId is required");

        var result = await _userProfileRepository.ChangePassword(
            request.UserId,
            request.CurrentPassword,
            request.NewPassword,
            cancellationToken);

        if (!result)
        {
            Logger.LogWarning("Invalid current password attempt for user {UserId}", request.UserId);
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        Logger.LogInformation("Password changed successfully for user {UserId}", request.UserId);

        var response = new ChangePasswordResponse(true, "Password successfully changed");
        return Success(response, "Password changed successfully. Please login again.");
    }
}
