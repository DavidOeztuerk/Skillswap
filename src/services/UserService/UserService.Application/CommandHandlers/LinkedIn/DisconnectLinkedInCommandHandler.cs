using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.LinkedIn;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.LinkedIn;

/// <summary>
/// Handler for disconnecting LinkedIn account
/// </summary>
public class DisconnectLinkedInCommandHandler(
    ILinkedInService linkedInService,
    IUserLinkedInConnectionRepository connectionRepository,
    IUserRepository userRepository,
    ITokenEncryptionService encryptionService,
    ILogger<DisconnectLinkedInCommandHandler> logger)
    : BaseCommandHandler<DisconnectLinkedInCommand, bool>(logger)
{
  private readonly ILinkedInService _linkedInService = linkedInService;
  private readonly IUserLinkedInConnectionRepository _connectionRepository = connectionRepository;
  private readonly IUserRepository _userRepository = userRepository;
  private readonly ITokenEncryptionService _encryptionService = encryptionService;

  public override async Task<ApiResponse<bool>> Handle(
      DisconnectLinkedInCommand request,
      CancellationToken cancellationToken)
  {
    // Get LinkedIn connection
    var connection = await _connectionRepository.GetByUserIdAsync(request.UserId!, cancellationToken);
    if (connection == null)
    {
      return Error("LinkedIn is not connected");
    }

    // Try to revoke access at LinkedIn (best effort)
    try
    {
      var accessToken = _encryptionService.Decrypt(connection.AccessToken);
      await _linkedInService.RevokeAccessAsync(accessToken, cancellationToken);
    }
    catch (Exception ex)
    {
      Logger.LogWarning(ex, "Failed to revoke LinkedIn access for user {UserId} (continuing with disconnect)",
          request.UserId);
    }

    // Remove imported data if requested
    if (request.RemoveImportedData)
    {
      var user = await _userRepository.GetByIdWithProfileAsync(request.UserId!, cancellationToken);
      if (user != null)
      {
        // Remove LinkedIn-imported experiences
        var linkedInExperiences = user.Experiences
            .Where(e => e.Source == ProfileDataSource.LinkedIn)
            .ToList();
        foreach (var exp in linkedInExperiences)
        {
          user.Experiences.Remove(exp);
        }

        // Remove LinkedIn-imported educations
        var linkedInEducations = user.Education
            .Where(e => e.Source == ProfileDataSource.LinkedIn)
            .ToList();
        foreach (var edu in linkedInEducations)
        {
          user.Education.Remove(edu);
        }

        await _userRepository.SaveChangesAsync(cancellationToken);

        Logger.LogInformation(
            "Removed {ExperienceCount} experiences and {EducationCount} educations imported from LinkedIn for user {UserId}",
            linkedInExperiences.Count, linkedInEducations.Count, request.UserId);
      }
    }

    // Delete connection
    await _connectionRepository.DeleteAsync(connection, cancellationToken);
    await _connectionRepository.SaveChangesAsync(cancellationToken);

    Logger.LogInformation("LinkedIn disconnected for user {UserId}", request.UserId);

    return Success(true, "LinkedIn disconnected successfully");
  }
}
