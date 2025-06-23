using CQRS.Handlers;
using Infrastructure.Models;
using Infrastructure.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;

namespace UserService.Application.CommandHandlers;

public class VerifyTwoFactorCodeCommandHandler(
    UserDbContext dbContext,
    ITotpService totpService,
    ILogger<VerifyTwoFactorCodeCommandHandler> logger)
    : BaseCommandHandler<VerifyTwoFactorCodeCommand, VerifyTwoFactorCodeResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly ITotpService _totpService = totpService;

    public override async Task<ApiResponse<VerifyTwoFactorCodeResponse>> Handle(
        VerifyTwoFactorCodeCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
            if (user == null)
            {
                return Error("User not found");
            }

            if (string.IsNullOrEmpty(user.TwoFactorSecret))
            {
                return Error("2FA not initialized");
            }

            if (!_totpService.VerifyCode(user.TwoFactorSecret, request.Code))
            {
                return Error("Invalid two-factor code");
            }

            user.TwoFactorEnabled = true;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return Success(new VerifyTwoFactorCodeResponse(true), "Two-factor enabled");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error verifying 2FA code for user {UserId}", request.UserId);
            return Error("Failed to verify two-factor code");
        }
    }
}
