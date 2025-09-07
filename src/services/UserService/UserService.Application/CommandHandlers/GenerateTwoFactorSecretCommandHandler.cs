using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers;

public class GenerateTwoFactorSecretCommandHandler(
    ITwoFactorRepository twoFactorRepository,
    ILogger<GenerateTwoFactorSecretCommandHandler> logger)
    : BaseCommandHandler<GenerateTwoFactorSecretCommand, GenerateTwoFactorSecretResponse>(logger)
{
    private readonly ITwoFactorRepository _twoFactorRepository = twoFactorRepository;

    public override async Task<ApiResponse<GenerateTwoFactorSecretResponse>> Handle(
        GenerateTwoFactorSecretCommand request,
        CancellationToken cancellationToken)
    {
        if (request.UserId is null) return Error("UserId is required", ErrorCodes.RequiredFieldMissing);

        try
        {
            var (secret, qrCodeUri, manualEntryKey) = await _twoFactorRepository.GenerateTwoFactorSecret(request.UserId, cancellationToken);

            Logger.LogInformation("2FA secret generated for user {UserId}", request.UserId);
            return Success(new GenerateTwoFactorSecretResponse(secret, qrCodeUri, manualEntryKey), "2FA secret generated");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error generating 2FA secret for user {UserId}", request.UserId);
            return Error("Failed to generate 2FA secret", ErrorCodes.InternalError);
        }
    }
}
