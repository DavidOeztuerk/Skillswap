using UserService.Application.Queries;
using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;

namespace UserService.Application.QueryHandlers;

public class GetPublicUserProfileQueryHandler(
    UserDbContext dbContext,
    ILogger<GetPublicUserProfileQueryHandler> logger)
    : BaseQueryHandler<GetPublicUserProfileQuery, PublicUserProfileResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<PublicUserProfileResponse>> Handle(GetPublicUserProfileQuery request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting public profile for user {UserId}", request.UserId);

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            return Error("User not found");
        }

        // Check if requesting user has blocked this user or vice versa
        var isBlocked = false;
        if (!string.IsNullOrEmpty(request.RequestingUserId))
        {
            isBlocked = await _dbContext.BlockedUsers
                .AnyAsync(b =>
                    (b.UserId == request.RequestingUserId && b.Id == request.UserId) ||
                    (b.UserId == request.UserId && b.Id == request.RequestingUserId),
                    cancellationToken);

            if (isBlocked)
            {
                return Error("User profile is not accessible");
            }
        }

        // Simplified implementation - return basic user data
        var averageRating = 0.0; // TODO: Implement rating system
        var totalReviews = 0; // TODO: Implement review system
        var skillsOffered = 0; // TODO: Get from SkillService
        var skillsLearned = 0; // TODO: Get from SkillService

        return Success(new PublicUserProfileResponse(
            user.Id,
            user.FirstName ?? "",
            user.LastName ?? "",
            user.UserName ?? "",
            user.Bio,
            user.ProfilcePictureUrl,
            user.CreatedAt,
            skillsOffered,
            skillsLearned,
            averageRating,
            totalReviews,
            isBlocked,
            new List<string>(), // TODO: Implement languages
            user.TimeZone
        ));
    }
}