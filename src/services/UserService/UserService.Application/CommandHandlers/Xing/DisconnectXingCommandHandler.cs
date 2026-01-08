using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Xing;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Xing;

/// <summary>
/// Handler for disconnecting Xing account
/// Phase 12: LinkedIn/Xing Integration
/// Note: Xing OAuth 1.0a doesn't have a standard revoke endpoint
/// </summary>
public class DisconnectXingCommandHandler(
    IUserXingConnectionRepository connectionRepository,
    IUserRepository userRepository,
    ILogger<DisconnectXingCommandHandler> logger)
    : BaseCommandHandler<DisconnectXingCommand, bool>(logger)
{
    private readonly IUserXingConnectionRepository _connectionRepository = connectionRepository;
    private readonly IUserRepository _userRepository = userRepository;

    public override async Task<ApiResponse<bool>> Handle(
        DisconnectXingCommand request,
        CancellationToken cancellationToken)
    {
        // Get Xing connection
        var connection = await _connectionRepository.GetByUserIdAsync(request.UserId!, cancellationToken);
        if (connection == null)
        {
            return Error("Xing is not connected");
        }

        // Remove imported data if requested
        if (request.RemoveImportedData)
        {
            var user = await _userRepository.GetByIdWithProfileAsync(request.UserId!, cancellationToken);
            if (user != null)
            {
                // Remove Xing-imported experiences
                var xingExperiences = user.Experiences
                    .Where(e => e.Source == ProfileDataSource.Xing)
                    .ToList();
                foreach (var exp in xingExperiences)
                {
                    user.Experiences.Remove(exp);
                }

                // Remove Xing-imported educations
                var xingEducations = user.Education
                    .Where(e => e.Source == ProfileDataSource.Xing)
                    .ToList();
                foreach (var edu in xingEducations)
                {
                    user.Education.Remove(edu);
                }

                await _userRepository.SaveChangesAsync(cancellationToken);

                Logger.LogInformation(
                    "Removed {ExperienceCount} experiences and {EducationCount} educations imported from Xing for user {UserId}",
                    xingExperiences.Count, xingEducations.Count, request.UserId);
            }
        }

        // Delete connection
        await _connectionRepository.DeleteAsync(connection, cancellationToken);
        await _connectionRepository.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Xing disconnected for user {UserId}", request.UserId);

        return Success(true, "Xing disconnected successfully");
    }
}
