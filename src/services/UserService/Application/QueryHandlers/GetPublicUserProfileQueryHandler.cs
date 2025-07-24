// using UserService.Application.Queries;
// using Microsoft.EntityFrameworkCore;
// using CQRS.Handlers;
// using Infrastructure.Models;

// namespace UserService.Application.QueryHandlers;

// public class GetPublicUserProfileQueryHandler(
//     UserDbContext dbContext,
//     ILogger<GetPublicUserProfileQueryHandler> logger)
//     : BaseQueryHandler<GetPublicUserProfileQuery, PublicUserProfileResponse>(logger)
// {
//     private readonly UserDbContext _dbContext = dbContext;

//     public override async Task<ApiResponse<PublicUserProfileResponse>> Handle(GetPublicUserProfileQuery request, CancellationToken cancellationToken)
//     {
//         Logger.LogInformation("Getting public profile for user {UserId}", request.UserId);

//         var user = await _dbContext.Users
//             .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

//         if (user == null)
//         {
//             return Error("User not found");
//         }

//         // Check if requesting user has blocked this user or vice versa
//         if (!string.IsNullOrEmpty(request.RequestingUserId))
//         {
//             var isBlocked = await _dbContext.BlockedUsers
//                 .AnyAsync(b =>
//                     (b.UserId == request.RequestingUserId && b.UserId == request.UserId) ||
//                     (b.UserId == request.UserId && b.UserId == request.RequestingUserId),
//                     cancellationToken);

//             if (isBlocked)
//             {
//                 return Error("User profile is not accessible");
//             }
//         }

//         // Get user's skills count
//         var skillsCount = await _dbContext.Users
//             .CountAsync(us => us.Id == request.UserId, cancellationToken);

//         // // Get user's rating
//         // var averageRating = await _dbContext.SkillRatings
//         //     .Where(sr => sr.RatedUserId == request.UserId)
//         //     .AverageAsync(sr => (double?)sr.Rating, cancellationToken) ?? 0.0;

//         // var ratingsCount = await _dbContext.SkillRatings
//         //     .CountAsync(sr => sr.RatedUserId == request.UserId, cancellationToken);

//         return Success(new PublicUserProfileResponse(
//             user.Id,
//             user.UserName,
//             user.FirstName,
//             user.LastName,
//             user.AvatarUrl,
//             user.Bio,
//             user.Location,
//             skillsCount,
//             averageRating,
//             ratingsCount,
//             user.CreatedAt,
//             user.LastLoginAt
//         ));
//     }
// }