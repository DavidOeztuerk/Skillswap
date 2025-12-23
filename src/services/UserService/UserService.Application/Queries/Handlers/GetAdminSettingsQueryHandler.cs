using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using Core.Common.Exceptions;

namespace UserService.Application.Queries.Handlers;

public class GetAdminSettingsQueryHandler(
    IConfiguration configuration,
    ILogger<GetAdminSettingsQueryHandler> logger)
    : BaseQueryHandler<GetAdminSettingsQuery, AdminSettingsResponse>(logger)
{
    private readonly IConfiguration _configuration = configuration;

    public override Task<ApiResponse<AdminSettingsResponse>> Handle(
        GetAdminSettingsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Getting admin settings");

            // Read settings from configuration
            // In a production app, these would typically come from a database
            var settings = new AdminSettingsResponse
            {
                MaintenanceMode = _configuration.GetValue<bool>("AdminSettings:MaintenanceMode", false),
                MaintenanceMessage = _configuration.GetValue<string>("AdminSettings:MaintenanceMessage"),
                RegistrationEnabled = _configuration.GetValue<bool>("AdminSettings:RegistrationEnabled", true),
                MaxUsersPerDay = _configuration.GetValue<int>("AdminSettings:MaxUsersPerDay", 100),
                MaxSkillsPerUser = _configuration.GetValue<int>("AdminSettings:MaxSkillsPerUser", 50),
                MaxMatchesPerUser = _configuration.GetValue<int>("AdminSettings:MaxMatchesPerUser", 20),
                EmailVerificationRequired = _configuration.GetValue<bool>("AdminSettings:EmailVerificationRequired", true),
                TwoFactorEnabled = _configuration.GetValue<bool>("AdminSettings:TwoFactorEnabled", true)
            };

            return Task.FromResult(Success(settings, "Admin settings retrieved successfully"));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting admin settings");
            return Task.FromResult(Error("Failed to retrieve admin settings", ErrorCodes.InternalError));
        }
    }
}
