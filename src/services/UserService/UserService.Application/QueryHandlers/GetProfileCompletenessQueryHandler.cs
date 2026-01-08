using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Core.Common.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries;
using UserService.Infrastructure.Data;

namespace UserService.Application.QueryHandlers;

/// <summary>
/// Handler for GetProfileCompletenessQuery
/// Phase 13: Profile Completeness
///
/// Completeness calculation:
/// - Bio vorhanden: 15%
/// - Profilbild: 15%
/// - Headline: 10%
/// - Mind. 1 Experience: 20%
/// - Mind. 1 Education: 15%
/// - Mind. 1 Skill: 15%
/// - LinkedIn/Xing verknüpft: 10%
/// </summary>
public class GetProfileCompletenessQueryHandler(
    UserDbContext dbContext,
    ILogger<GetProfileCompletenessQueryHandler> logger)
    : BaseQueryHandler<GetProfileCompletenessQuery, ProfileCompletenessResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    // Weight constants matching the requirements
    private const int WeightBio = 15;
    private const int WeightProfilePicture = 15;
    private const int WeightHeadline = 10;
    private const int WeightExperience = 20;
    private const int WeightEducation = 15;
    private const int WeightSkill = 15;
    private const int WeightSocialConnection = 10;

    public override async Task<ApiResponse<ProfileCompletenessResponse>> Handle(
        GetProfileCompletenessQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Calculating profile completeness for user {UserId}", request.UserId);

        // Fetch user with related data in a single query
        var user = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == request.UserId && !u.IsDeleted)
            .Select(u => new
            {
                u.Id,
                u.Bio,
                u.ProfilePictureUrl,
                u.Headline,
                HasExperience = u.Experiences.Any(e => !e.IsDeleted),
                HasEducation = u.Education.Any(e => !e.IsDeleted),
                HasSkill = u.ImportedSkills.Any(s => !s.IsDeleted),
                HasLinkedIn = u.LinkedInConnection != null && !u.LinkedInConnection.IsDeleted,
                HasXing = u.XingConnection != null && !u.XingConnection.IsDeleted
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null)
        {
            throw new ResourceNotFoundException("User", request.UserId);
        }

        // Calculate completeness items
        var items = new List<ProfileCompletenessItem>
        {
            new()
            {
                Key = "bio",
                Label = "Biografie hinzufügen",
                IsCompleted = !string.IsNullOrWhiteSpace(user.Bio),
                Weight = WeightBio,
                Hint = "Erzähle anderen etwas über dich",
                ActionUrl = "/profile#bio",
                Icon = "Description"
            },
            new()
            {
                Key = "profilePicture",
                Label = "Profilbild hochladen",
                IsCompleted = !string.IsNullOrWhiteSpace(user.ProfilePictureUrl),
                Weight = WeightProfilePicture,
                Hint = "Ein Foto macht dein Profil persönlicher",
                ActionUrl = "/profile#avatar",
                Icon = "AccountCircle"
            },
            new()
            {
                Key = "headline",
                Label = "Headline hinzufügen",
                IsCompleted = !string.IsNullOrWhiteSpace(user.Headline),
                Weight = WeightHeadline,
                Hint = "Beschreibe dich in einem Satz",
                ActionUrl = "/profile#headline",
                Icon = "Title"
            },
            new()
            {
                Key = "experience",
                Label = "Berufserfahrung hinzufügen",
                IsCompleted = user.HasExperience,
                Weight = WeightExperience,
                Hint = "Füge mindestens eine berufliche Station hinzu",
                ActionUrl = "/profile#experience",
                Icon = "Work"
            },
            new()
            {
                Key = "education",
                Label = "Ausbildung hinzufügen",
                IsCompleted = user.HasEducation,
                Weight = WeightEducation,
                Hint = "Füge mindestens eine Ausbildung hinzu",
                ActionUrl = "/profile#education",
                Icon = "School"
            },
            new()
            {
                Key = "skill",
                Label = "Fähigkeiten hinzufügen",
                IsCompleted = user.HasSkill,
                Weight = WeightSkill,
                Hint = "Füge mindestens eine berufliche Fähigkeit hinzu",
                ActionUrl = "/profile#skills",
                Icon = "Psychology"
            },
            new()
            {
                Key = "socialConnection",
                Label = "LinkedIn oder Xing verbinden",
                IsCompleted = user.HasLinkedIn || user.HasXing,
                Weight = WeightSocialConnection,
                Hint = "Verbinde dein Profil mit LinkedIn oder Xing",
                ActionUrl = "/profile#connections",
                Icon = "Link"
            }
        };

        // Calculate totals
        var totalPoints = items.Sum(i => i.Weight);
        var earnedPoints = items.Sum(i => i.Points);
        var percentage = totalPoints > 0 ? (int)Math.Round((double)earnedPoints / totalPoints * 100) : 0;
        var completedCount = items.Count(i => i.IsCompleted);

        // Determine level
        var level = percentage switch
        {
            >= 90 => ProfileCompletenessLevel.Expert,
            >= 75 => ProfileCompletenessLevel.Advanced,
            >= 50 => ProfileCompletenessLevel.Intermediate,
            >= 25 => ProfileCompletenessLevel.Basic,
            _ => ProfileCompletenessLevel.Beginner
        };

        var response = new ProfileCompletenessResponse
        {
            UserId = user.Id,
            Percentage = percentage,
            TotalPoints = totalPoints,
            EarnedPoints = earnedPoints,
            CompletedCount = completedCount,
            TotalCount = items.Count,
            Level = level,
            Items = items,
            CalculatedAt = DateTime.UtcNow
        };

        Logger.LogInformation(
            "Profile completeness for user {UserId}: {Percentage}% ({CompletedCount}/{TotalCount} items)",
            request.UserId, percentage, completedCount, items.Count);

        return Success(response);
    }
}
