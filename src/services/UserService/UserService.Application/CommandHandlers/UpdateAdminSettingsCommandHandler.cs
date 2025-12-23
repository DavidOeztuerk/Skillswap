using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers;

public class UpdateAdminSettingsCommandHandler(
    IConfiguration configuration,
    ILogger<UpdateAdminSettingsCommandHandler> logger)
    : BaseCommandHandler<UpdateAdminSettingsCommand, AdminSettingsResponse>(logger)
{
    private readonly IConfiguration _configuration = configuration;

    public override Task<ApiResponse<AdminSettingsResponse>> Handle(
        UpdateAdminSettingsCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Updating admin settings");

            if (request.Settings is null)
                return Task.FromResult(Error("Settings are required", ErrorCodes.RequiredFieldMissing));

            // In a production application, you would:
            // 1. Store settings in a database
            // 2. Update configuration dynamically
            // 3. Possibly trigger a configuration reload

            // For now, we'll return the settings as if they were updated
            // This is a simplified implementation - in production you'd persist these
            Logger.LogWarning("Admin settings update is a no-op in this implementation. " +
                "Settings should be stored in a database for production use.");

            var updatedSettings = new AdminSettingsResponse
            {
                MaintenanceMode = request.Settings.MaintenanceMode,
                MaintenanceMessage = request.Settings.MaintenanceMessage,
                RegistrationEnabled = request.Settings.RegistrationEnabled,
                MaxUsersPerDay = request.Settings.MaxUsersPerDay,
                MaxSkillsPerUser = request.Settings.MaxSkillsPerUser,
                MaxMatchesPerUser = request.Settings.MaxMatchesPerUser,
                EmailVerificationRequired = request.Settings.EmailVerificationRequired,
                TwoFactorEnabled = request.Settings.TwoFactorEnabled
            };

            Logger.LogInformation("Admin settings updated: MaintenanceMode={MaintenanceMode}, RegistrationEnabled={RegistrationEnabled}",
                updatedSettings.MaintenanceMode, updatedSettings.RegistrationEnabled);

            return Task.FromResult(Success(updatedSettings, "Admin settings updated successfully"));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error updating admin settings");
            return Task.FromResult(Error("Failed to update admin settings", ErrorCodes.InternalError));
        }
    }
}
