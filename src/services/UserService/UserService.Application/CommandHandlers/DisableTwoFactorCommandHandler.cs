using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers;

public class DisableTwoFactorCommandHandler(
    ITwoFactorRepository twoFactorRepository,
    ILogger<DisableTwoFactorCommandHandler> logger)
    : BaseCommandHandler<DisableTwoFactorCommand, DisableTwoFactorResponse>(logger)
{
    private readonly ITwoFactorRepository _twoFactorRepository = twoFactorRepository;

    public override async Task<ApiResponse<DisableTwoFactorResponse>> Handle(
        DisableTwoFactorCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.UserId))
        {
            return Error("UserId is required", ErrorCodes.RequiredFieldMissing);
        }

        if (string.IsNullOrEmpty(request.Password))
        {
            return Error("Password is required for security verification", ErrorCodes.RequiredFieldMissing);
        }

        try
        {
            Logger.LogInformation("Attempting to disable 2FA for user {UserId}", request.UserId);

            // DisableTwoFactor method verifies the password internally
            await _twoFactorRepository.DisableTwoFactor(
                request.UserId,
                request.Password,
                cancellationToken);

            Logger.LogInformation("Two-factor authentication disabled successfully for user {UserId}", request.UserId);
            
            return Success(
                new DisableTwoFactorResponse(true, "Two-factor authentication has been disabled"), 
                "Two-factor authentication disabled successfully");
        }
        catch (UnauthorizedAccessException ex)
        {
            Logger.LogWarning(ex, "Invalid password provided for disabling 2FA for user {UserId}", request.UserId);
            return Error("Invalid password. Please verify your password and try again.", ErrorCodes.InvalidCredentials);
        }
        catch (System.InvalidOperationException ex)
        {
            Logger.LogWarning(ex, "Failed to disable 2FA for user {UserId}: {Message}", request.UserId, ex.Message);
            return Error(ex.Message, ErrorCodes.InvalidOperation);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error disabling 2FA for user {UserId}", request.UserId);
            return Error("An error occurred while disabling two-factor authentication", ErrorCodes.InternalError);
        }
    }
}