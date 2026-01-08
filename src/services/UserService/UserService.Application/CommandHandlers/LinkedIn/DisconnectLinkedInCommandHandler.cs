using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.LinkedIn;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.LinkedIn;

/// <summary>
/// Handler for disconnecting LinkedIn account
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class DisconnectLinkedInCommandHandler : IRequestHandler<DisconnectLinkedInCommand, ApiResponse<bool>>
{
    private readonly ILinkedInService _linkedInService;
    private readonly IUserLinkedInConnectionRepository _connectionRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITokenEncryptionService _encryptionService;
    private readonly ILogger<DisconnectLinkedInCommandHandler> _logger;

    public DisconnectLinkedInCommandHandler(
        ILinkedInService linkedInService,
        IUserLinkedInConnectionRepository connectionRepository,
        IUserRepository userRepository,
        ITokenEncryptionService encryptionService,
        ILogger<DisconnectLinkedInCommandHandler> logger)
    {
        _linkedInService = linkedInService;
        _connectionRepository = connectionRepository;
        _userRepository = userRepository;
        _encryptionService = encryptionService;
        _logger = logger;
    }

    public async Task<ApiResponse<bool>> Handle(
        DisconnectLinkedInCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get LinkedIn connection
            var connection = await _connectionRepository.GetByUserIdAsync(request.UserId, cancellationToken);
            if (connection == null)
            {
                return ApiResponse<bool>.ErrorResult("LinkedIn is not connected");
            }

            // Try to revoke access at LinkedIn (best effort)
            try
            {
                var accessToken = _encryptionService.Decrypt(connection.AccessToken);
                await _linkedInService.RevokeAccessAsync(accessToken, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to revoke LinkedIn access for user {UserId} (continuing with disconnect)",
                    request.UserId);
            }

            // Remove imported data if requested
            if (request.RemoveImportedData)
            {
                var user = await _userRepository.GetByIdWithProfileAsync(request.UserId, cancellationToken);
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

                    _logger.LogInformation(
                        "Removed {ExperienceCount} experiences and {EducationCount} educations imported from LinkedIn for user {UserId}",
                        linkedInExperiences.Count, linkedInEducations.Count, request.UserId);
                }
            }

            // Delete connection
            await _connectionRepository.DeleteAsync(connection, cancellationToken);
            await _connectionRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("LinkedIn disconnected for user {UserId}", request.UserId);

            return ApiResponse<bool>.SuccessResult(true, "LinkedIn disconnected successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting LinkedIn for user {UserId}", request.UserId);
            return ApiResponse<bool>.ErrorResult("Failed to disconnect LinkedIn");
        }
    }
}
