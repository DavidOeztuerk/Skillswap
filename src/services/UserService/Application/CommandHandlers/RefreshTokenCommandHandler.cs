using Contracts.User.Responses;
using CQRS.Handlers;
using Infrastructure.Models;
using Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;
using UserService.Domain.Models;

namespace UserService.Application.CommandHandlers;

public class RefreshTokenCommandHandler(
    UserDbContext dbContext,
    IJwtService jwtService,
    ILogger<RefreshTokenCommandHandler> logger)
    : BaseCommandHandler<RefreshTokenCommand, RefreshTokenResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IJwtService _jwtService = jwtService;

    public override async Task<ApiResponse<RefreshTokenResponse>> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate the expired access token
            var principal = await _jwtService.GetPrincipalFromExpiredTokenAsync(request.AccessToken);
            if (principal == null)
            {
                return Error("Invalid access token");
            }

            var userId = principal.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Error("Invalid token claims");
            }

            // Validate refresh token
            var refreshToken = await _dbContext.RefreshTokens
                .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken
                                         && rt.UserId == userId
                                         && !rt.IsRevoked, cancellationToken);

            if (refreshToken == null || refreshToken.ExpiryDate < DateTime.UtcNow)
            {
                return Error("Invalid or expired refresh token");
            }

            // Revoke the old refresh token
            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTime.UtcNow;

            // Generate new tokens

            var userClaims = new UserClaims
            {
                UserId = refreshToken.User.Id,
                Email = refreshToken.User.Email,
                FirstName = refreshToken.User.FirstName,
                LastName = refreshToken.User.LastName,
                Roles = refreshToken.User.UserRoles.Select(ur => ur.Role).ToList(),
                EmailVerified = refreshToken.User.EmailVerified,
                AccountStatus = refreshToken.User.AccountStatus.ToString()
            };

            var tokens = await _jwtService.GenerateTokenAsync(userClaims);

            // Store new refresh token
            var newRefreshToken = new RefreshToken
            {
                Token = tokens.RefreshToken,
                UserId = refreshToken.User.Id,
                ExpiryDate = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };

            _dbContext.RefreshTokens.Add(newRefreshToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Tokens refreshed for user {UserId}", userId);

            var response = new RefreshTokenResponse(
                tokens.AccessToken,
                tokens.RefreshToken,
                tokens.TokenType,
                tokens.ExpiresIn,
                tokens.ExpiresAt);

            return Success(response, "Tokens refreshed successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error refreshing tokens");
            return Error("An error occurred while refreshing tokens. Please login again.");
        }
    }
}
