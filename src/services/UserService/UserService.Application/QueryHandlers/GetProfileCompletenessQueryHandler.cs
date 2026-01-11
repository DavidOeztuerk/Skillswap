using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

/// <summary>
/// Handler for GetProfileCompletenessQuery
///
/// Completeness calculation (6 items, 100% total):
/// - Bio vorhanden: 20%
/// - Profilbild: 15%
/// - Mind. 1 Experience: 25%
/// - Mind. 1 Education: 15%
/// - Mind. 1 Skill: 15%
/// - LinkedIn/Xing verknüpft: 10%
/// </summary>
public class GetProfileCompletenessQueryHandler(
    IUserRepository userRepository,
    ILogger<GetProfileCompletenessQueryHandler> logger)
    : BaseQueryHandler<GetProfileCompletenessQuery, ProfileCompletenessResponse>(logger)
{
  private readonly IUserRepository _userRepository = userRepository;

  // Weight constants matching the requirements
  // Headline removed - can be derived from latest experience
  private const int WeightBio = 20;
  private const int WeightProfilePicture = 15;
  private const int WeightExperience = 25;
  private const int WeightEducation = 15;
  private const int WeightSkill = 15;
  private const int WeightSocialConnection = 10;

  public override async Task<ApiResponse<ProfileCompletenessResponse>> Handle(
      GetProfileCompletenessQuery request,
      CancellationToken cancellationToken)
  {
    var userId = request.UserId.ToString();
    Logger.LogInformation("Calculating profile completeness for user {UserId}", userId);

    // Fetch user profile completeness data via repository
    var user = await _userRepository.GetProfileCompletenessDataAsync(userId, cancellationToken);

    if (user == null)
    {
      throw new ResourceNotFoundException("User", userId);
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

    // Determine level based on profile completion percentage
    var level = percentage switch
    {
      >= 90 => ProfileCompletenessLevel.Complete,
      >= 75 => ProfileCompletenessLevel.AlmostThere,
      >= 50 => ProfileCompletenessLevel.GoodProgress,
      >= 25 => ProfileCompletenessLevel.MakingProgress,
      _ => ProfileCompletenessLevel.GettingStarted
    };

    var response = new ProfileCompletenessResponse
    {
      UserId = request.UserId,
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
        userId, percentage, completedCount, items.Count);

    return Success(response);
  }
}
