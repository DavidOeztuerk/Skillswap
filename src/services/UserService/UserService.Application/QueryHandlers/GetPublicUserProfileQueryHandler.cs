using CQRS.Handlers;
using UserService.Domain.Repositories;
using UserService.Api.Application.Queries;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using Core.Common.Exceptions;
using Contracts.User.Responses;

namespace UserService.Application.QueryHandlers;

public class GetPublicUserProfileQueryHandler(
    IUserProfileRepository userProfileRepository,
    IUserBlockingRepository userBlockingRepository,
    ILogger<GetPublicUserProfileQueryHandler> logger)
    : BaseQueryHandler<GetPublicUserProfileQuery, PublicUserProfileResponse>(logger)
{
    private readonly IUserProfileRepository _userProfileRepository = userProfileRepository;
    private readonly IUserBlockingRepository _userBlockingRepository = userBlockingRepository;

    public override async Task<ApiResponse<PublicUserProfileResponse>> Handle(GetPublicUserProfileQuery request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting public profile for user {UserId}", request.UserId);

        var user = await _userProfileRepository.GetPublicUserProfile(request.UserId, request.RequestingUserId ?? "", cancellationToken);

        if (user == null)
        {
            throw new ResourceNotFoundException("User", request.UserId);
        }

        // Check if requesting user has blocked this user or vice versa
        var isBlocked = false;
        if (!string.IsNullOrEmpty(request.RequestingUserId) && request.RequestingUserId != "system")
        {
            isBlocked = await _userBlockingRepository.IsUserBlocked(request.RequestingUserId, request.UserId, cancellationToken);

            if (isBlocked)
            {
                throw new InsufficientPermissionsException("User profile is not accessible");
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
            user.ProfilePictureUrl,
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