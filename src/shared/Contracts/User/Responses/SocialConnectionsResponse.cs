using Contracts.User.Responses.LinkedIn;
using Contracts.User.Responses.Xing;

namespace Contracts.User.Responses;

/// <summary>
/// Combined response for all social connections and imported data
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record SocialConnectionsResponse(
    LinkedInConnectionResponse? LinkedIn,
    XingConnectionResponse? Xing,
    List<UserImportedSkillResponse> ImportedSkills,
    SocialConnectionsSummary Summary);

/// <summary>
/// Summary of imported data from social connections
/// </summary>
public record SocialConnectionsSummary(
    int TotalImportedSkills,
    int LinkedInSkillCount,
    int XingSkillCount,
    int ManualSkillCount,
    int TotalImportedExperiences,
    int TotalImportedEducations,
    bool HasLinkedInConnection,
    bool HasXingConnection);
