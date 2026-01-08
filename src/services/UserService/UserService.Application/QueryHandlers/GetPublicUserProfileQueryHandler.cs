using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Contracts.User.Responses;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Api.Application.Queries;
using UserService.Application.Services;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class GetPublicUserProfileQueryHandler(
    IUserProfileRepository userProfileRepository,
    IUserBlockingRepository userBlockingRepository,
    ISkillServiceClient skillServiceClient,
    UserDbContext dbContext,
    ILogger<GetPublicUserProfileQueryHandler> logger)
    : BaseQueryHandler<GetPublicUserProfileQuery, PublicUserProfileResponse>(logger)
{
    private readonly IUserProfileRepository _userProfileRepository = userProfileRepository;
    private readonly IUserBlockingRepository _userBlockingRepository = userBlockingRepository;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;
    private readonly UserDbContext _dbContext = dbContext;

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

        // Get statistics from local UserStatistics table (Phase 6)
        var statistics = await _dbContext.UserStatistics
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == request.UserId, cancellationToken);

        int skillsOffered;
        int skillsLearned;
        double averageRating;
        int totalReviews;
        int completedSessions;

        if (statistics != null)
        {
            // Use denormalized statistics (faster, updated via events)
            skillsOffered = statistics.SkillsOfferedCount;
            skillsLearned = statistics.SkillsWantedCount;
            averageRating = statistics.AverageRating ?? 0.0;
            totalReviews = statistics.ReviewsReceivedCount;
            completedSessions = statistics.SessionsCompletedCount;
        }
        else
        {
            // Fallback to ServiceCommunication if no statistics yet
            var skillCounts = await _skillServiceClient.GetUserSkillCountsAsync(request.UserId, cancellationToken);
            skillsOffered = skillCounts?.OfferedCount ?? 0;
            skillsLearned = skillCounts?.RequestedCount ?? 0;
            averageRating = 0.0;
            totalReviews = 0;
            completedSessions = 0;
        }

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