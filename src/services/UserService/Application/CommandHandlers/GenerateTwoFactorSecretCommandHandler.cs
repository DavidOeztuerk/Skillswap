using CQRS.Handlers;
using Infrastructure.Models;
using Infrastructure.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;

namespace UserService.Application.CommandHandlers;

public class GenerateTwoFactorSecretCommandHandler(
    UserDbContext dbContext,
    ITotpService totpService,
    ILogger<GenerateTwoFactorSecretCommandHandler> logger)
    : BaseCommandHandler<GenerateTwoFactorSecretCommand, GenerateTwoFactorSecretResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly ITotpService _totpService = totpService;

    public override async Task<ApiResponse<GenerateTwoFactorSecretResponse>> Handle(
        GenerateTwoFactorSecretCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
            if (user == null)
            {
                return Error("User not found");
            }

            var secret = _totpService.GenerateSecret();
            user.TwoFactorSecret = secret;
            user.TwoFactorEnabled = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);

            return Success(new GenerateTwoFactorSecretResponse(secret), "2FA secret generated");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error generating 2FA secret for user {UserId}", request.UserId);
            return Error("Failed to generate 2FA secret");
        }
    }
}
