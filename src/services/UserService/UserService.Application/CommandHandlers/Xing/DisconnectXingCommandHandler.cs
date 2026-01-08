using CQRS.Models;
using MediatR;
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
public class DisconnectXingCommandHandler : IRequestHandler<DisconnectXingCommand, ApiResponse<bool>>
{
    private readonly IUserXingConnectionRepository _connectionRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<DisconnectXingCommandHandler> _logger;

    public DisconnectXingCommandHandler(
        IUserXingConnectionRepository connectionRepository,
        IUserRepository userRepository,
        ILogger<DisconnectXingCommandHandler> logger)
    {
        _connectionRepository = connectionRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<ApiResponse<bool>> Handle(
        DisconnectXingCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get Xing connection
            var connection = await _connectionRepository.GetByUserIdAsync(request.UserId, cancellationToken);
            if (connection == null)
            {
                return ApiResponse<bool>.ErrorResult("Xing is not connected");
            }

            // Remove imported data if requested
            if (request.RemoveImportedData)
            {
                var user = await _userRepository.GetByIdWithProfileAsync(request.UserId, cancellationToken);
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

                    _logger.LogInformation(
                        "Removed {ExperienceCount} experiences and {EducationCount} educations imported from Xing for user {UserId}",
                        xingExperiences.Count, xingEducations.Count, request.UserId);
                }
            }

            // Delete connection
            await _connectionRepository.DeleteAsync(connection, cancellationToken);
            await _connectionRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Xing disconnected for user {UserId}", request.UserId);

            return ApiResponse<bool>.SuccessResult(true, "Xing disconnected successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting Xing for user {UserId}", request.UserId);
            return ApiResponse<bool>.ErrorResult("Failed to disconnect Xing");
        }
    }
}
