using UserService.Application.Queries;
using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;

namespace UserService.Application.QueryHandlers;

public class GetTwoFactorStatusQueryHandler(
    UserDbContext dbContext,
    ILogger<GetTwoFactorStatusQueryHandler> logger)
    : BaseQueryHandler<GetTwoFactorStatusQuery, TwoFactorStatusResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<TwoFactorStatusResponse>> Handle(GetTwoFactorStatusQuery request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting two-factor status for user {UserId}", request.UserId);

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            return Error("User not found");
        }

        var twoFactorEnabled = !string.IsNullOrEmpty(user.TwoFactorSecret);
        // var backupCodesCount = await _dbContext.TwoFactorBackupCodes
        //     .CountAsync(c => c.UserId == request.UserId && !c.IsUsed, cancellationToken);

        return Success(new TwoFactorStatusResponse(
            twoFactorEnabled,
            user.TwoFactorEnabled,
            DateTime.Now,
            []
        ));
    }
}