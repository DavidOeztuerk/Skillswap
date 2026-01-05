using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Api.Application.Queries;
using UserService.Application.Services;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class GetPublicUserProfileQueryHandler(
    IUserProfileRepository userProfileRepository,
    IUserBlockingRepository userBlockingRepository,
    ISkillServiceClient skillServiceClient,
    ILogger<GetPublicUserProfileQueryHandler> logger)
    : BaseQueryHandler<GetPublicUserProfileQuery, PublicUserProfileResponse>(logger)
{
    private readonly IUserProfileRepository _userProfileRepository = userProfileRepository;
    private readonly IUserBlockingRepository _userBlockingRepository = userBlockingRepository;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

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

        // Get skill counts from SkillService
        var skillCounts = await _skillServiceClient.GetUserSkillCountsAsync(request.UserId, cancellationToken);
        var skillsOffered = skillCounts?.OfferedCount ?? 0;
        var skillsLearned = skillCounts?.RequestedCount ?? 0;

        // TODO: Get from ReviewService or calculate from User's reviews
        var averageRating = 0.0;
        var totalReviews = 0;

        // TODO: Get from AppointmentService
        var completedSessions = 0;

        // Map experience
        var experience = user.Experiences?
            .Select(e => new UserExperienceResponse(
                e.Id,
                e.Title,
                e.Company,
                e.StartDate,
                e.EndDate,
                e.Description,
                e.IsCurrent))
            .ToList() ?? [];

        // Map education
        var education = user.Education?
            .Select(e => new UserEducationResponse(
                e.Id,
                e.Degree,
                e.Institution,
                e.GraduationYear,
                e.GraduationMonth,
                e.Description))
            .ToList() ?? [];

        return Success(new PublicUserProfileResponse(
            user.Id,
            user.FirstName ?? "",
            user.LastName ?? "",
            user.UserName ?? "",
            user.Headline,
            user.Bio,
            user.ProfilePictureUrl,
            user.CreatedAt,
            skillsOffered,
            skillsLearned,
            completedSessions,
            averageRating,
            totalReviews,
            isBlocked,
            new List<string>(), // TODO: Implement languages
            user.TimeZone,
            experience,
            education
        ));
    }
}