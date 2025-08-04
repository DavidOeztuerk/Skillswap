using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Infrastructure.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers;

public class VerifyTwoFactorCodeCommandHandler(
    ITwoFactorRepository twoFactorRepository,
    ILogger<VerifyTwoFactorCodeCommandHandler> logger)
    : BaseCommandHandler<VerifyTwoFactorCodeCommand, VerifyTwoFactorCodeResponse>(logger)
{
    private readonly ITwoFactorRepository _twoFactorRepository = twoFactorRepository;

    public override async Task<ApiResponse<VerifyTwoFactorCodeResponse>> Handle(
        VerifyTwoFactorCodeCommand request,
        CancellationToken cancellationToken)
    {
        if (request.UserId is null) return Error("UserId is required");

        try
        {
            var isValid = await _twoFactorRepository.VerifyTwoFactorCode(
                request.UserId,
                request.Code,
                cancellationToken);

            if (isValid)
            {
                Logger.LogInformation("Two-factor authentication enabled for user {UserId}", request.UserId);
                return Success(new VerifyTwoFactorCodeResponse(true), "Two-factor authentication enabled successfully");
            }

            return Error("Invalid two-factor authentication code. Please try again.");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error verifying 2FA code for user {UserId}", request.UserId);
            return Error("Failed to verify two-factor code");
        }
    }
}
