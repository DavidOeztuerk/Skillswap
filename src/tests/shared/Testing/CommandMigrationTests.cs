using Xunit;
using System.IO;
using FluentAssertions;
using System.Linq;

namespace Testing;

public class CommandMigrationTests
{
    private readonly string _sharedPath = "/home/ditss/Source/Repos/Skillswap/src/shared";

    [Fact]
    public void AllUserCommands_Should_BeMigrated()
    {
        // Arrange
        var expectedUserCommands = new[]
        {
            "RegisterUserCommand.cs",
            "LoginUserCommand.cs",
            "RefreshTokenCommand.cs",
            "VerifyEmailCommand.cs",
            "ResendVerificationCommand.cs",
            "ChangePasswordCommand.cs",
            "RequestPasswordResetCommand.cs",
            "ResetPasswordCommand.cs",
            "GenerateTwoFactorSecretCommand.cs",
            "VerifyTwoFactorCodeCommand.cs",
            "DisableTwoFactorCommand.cs",
            "UpdateUserProfileCommand.cs",
            "UploadAvatarCommand.cs",
            "DeleteAvatarCommand.cs",
            "UpdateUserStatusCommand.cs",
            "UpdateUserAvailabilityCommand.cs",
            "BlockUserCommand.cs",
            "UnblockUserCommand.cs",
            "AddFavoriteSkillCommand.cs",
            "RemoveFavoriteSkillCommand.cs",
            "UpdateNotificationPreferencesCommand.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Commands", "User");

        // Act & Assert
        foreach (var command in expectedUserCommands)
        {
            var filePath = Path.Combine(expectedPath, command);
            File.Exists(filePath).Should().BeTrue($"User command {command} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllSkillCommands_Should_BeMigrated()
    {
        // Arrange
        var expectedSkillCommands = new[]
        {
            "CreateSkillCommand.cs",
            "UpdateSkillCommand.cs",
            "DeleteSkillCommand.cs",
            "BulkUpdateSkillsCommand.cs",
            "CreateSkillCategoryCommand.cs",
            "UpdateSkillCategoryCommand.cs",
            "CreateProficiencyLevelCommand.cs",
            "EndorseSkillCommand.cs",
            "RateSkillCommand.cs",
            "ImportSkillsCommand.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Commands", "Skill");

        // Act & Assert
        foreach (var command in expectedSkillCommands)
        {
            var filePath = Path.Combine(expectedPath, command);
            File.Exists(filePath).Should().BeTrue($"Skill command {command} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllMatchmakingCommands_Should_BeMigrated()
    {
        // Arrange
        var expectedMatchmakingCommands = new[]
        {
            "FindMatchCommand.cs",
            "CreateMatchRequestCommand.cs",
            "AcceptMatchCommand.cs",
            "RejectMatchCommand.cs",
            "CompleteMatchCommand.cs",
            "AcceptMatchRequestCommand.cs",
            "RejectMatchRequestCommand.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Commands", "Matchmaking");

        // Act & Assert
        foreach (var command in expectedMatchmakingCommands)
        {
            var filePath = Path.Combine(expectedPath, command);
            File.Exists(filePath).Should().BeTrue($"Matchmaking command {command} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllAppointmentCommands_Should_BeMigrated()
    {
        // Arrange
        var expectedAppointmentCommands = new[]
        {
            "CreateAppointmentCommand.cs",
            "AcceptAppointmentCommand.cs",
            "CancelAppointmentCommand.cs",
            "RescheduleAppointmentCommand.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Commands", "Appointment");

        // Act & Assert
        foreach (var command in expectedAppointmentCommands)
        {
            var filePath = Path.Combine(expectedPath, command);
            File.Exists(filePath).Should().BeTrue($"Appointment command {command} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllVideoCallCommands_Should_BeMigrated()
    {
        // Arrange
        var expectedVideoCallCommands = new[]
        {
            "CreateCallSessionCommand.cs",
            "JoinCallCommand.cs",
            "LeaveCallCommand.cs",
            "StartCallCommand.cs",
            "EndCallCommand.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Commands", "VideoCall");

        // Act & Assert
        foreach (var command in expectedVideoCallCommands)
        {
            var filePath = Path.Combine(expectedPath, command);
            File.Exists(filePath).Should().BeTrue($"VideoCall command {command} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllNotificationCommands_Should_BeMigrated()
    {
        // Arrange
        var expectedNotificationCommands = new[]
        {
            "SendNotificationCommand.cs",
            "SendBulkNotificationCommand.cs",
            "MarkNotificationAsReadCommand.cs",
            "CancelNotificationCommand.cs",
            "RetryFailedNotificationCommand.cs",
            "CreateEmailTemplateCommand.cs",
            "UpdateEmailTemplateCommand.cs",
            "UpdateNotificationPreferencesCommand.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Commands", "Notification");

        // Act & Assert
        foreach (var command in expectedNotificationCommands)
        {
            var filePath = Path.Combine(expectedPath, command);
            File.Exists(filePath).Should().BeTrue($"Notification command {command} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllUserCommandHandlers_Should_BeMigrated()
    {
        // Arrange
        var expectedUserHandlers = new[]
        {
            "RegisterUserCommandHandler.cs",
            "LoginUserCommandHandler.cs",
            "RefreshTokenCommandHandler.cs",
            "VerifyEmailCommandHandler.cs",
            "ChangePasswordCommandHandler.cs",
            "RequestPasswordResetCommandHandler.cs",
            "ResetPasswordCommandHandler.cs",
            "GenerateTwoFactorSecretCommandHandler.cs",
            "VerifyTwoFactorCodeCommandHandler.cs",
            "UpdateUserProfileCommandHandler.cs",
            "AddFavoriteSkillCommandHandler.cs",
            "RemoveFavoriteSkillCommandHandler.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "CommandHandlers", "User");

        // Act & Assert
        foreach (var handler in expectedUserHandlers)
        {
            var filePath = Path.Combine(expectedPath, handler);
            File.Exists(filePath).Should().BeTrue($"User command handler {handler} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllSkillCommandHandlers_Should_BeMigrated()
    {
        // Arrange
        var expectedSkillHandlers = new[]
        {
            "CreateSkillCommandHandler.cs",
            "UpdateSkillCommandHandler.cs",
            "DeleteSkillCommandHandler.cs",
            "EndorseSkillCommandHandler.cs",
            "RateSkillCommandHandler.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "CommandHandlers", "Skill");

        // Act & Assert
        foreach (var handler in expectedSkillHandlers)
        {
            var filePath = Path.Combine(expectedPath, handler);
            File.Exists(filePath).Should().BeTrue($"Skill command handler {handler} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void CommandsAndHandlers_Should_HaveMatchingNamespaces()
    {
        // Arrange
        var commandsPath = Path.Combine(_sharedPath, "Commands");
        var handlersPath = Path.Combine(_sharedPath, "CommandHandlers");

        if (!Directory.Exists(commandsPath) || !Directory.Exists(handlersPath)) return;

        var commandFiles = Directory.GetFiles(commandsPath, "*.cs", SearchOption.AllDirectories);
        var handlerFiles = Directory.GetFiles(handlersPath, "*.cs", SearchOption.AllDirectories);

        // Act & Assert
        foreach (var commandFile in commandFiles)
        {
            var commandContent = File.ReadAllText(commandFile);
            var commandDir = Path.GetDirectoryName(commandFile)?.Replace(commandsPath, "").Trim('/', '\\');
            var expectedNamespace = $"Commands{(string.IsNullOrEmpty(commandDir) ? "" : "." + commandDir.Replace(Path.DirectorySeparatorChar, '.'))}";
            
            commandContent.Should().Contain($"namespace {expectedNamespace}",
                $"Command {Path.GetFileName(commandFile)} should have namespace {expectedNamespace}");
        }

        foreach (var handlerFile in handlerFiles)
        {
            var handlerContent = File.ReadAllText(handlerFile);
            var handlerDir = Path.GetDirectoryName(handlerFile)?.Replace(handlersPath, "").Trim('/', '\\');
            var expectedNamespace = $"CommandHandlers{(string.IsNullOrEmpty(handlerDir) ? "" : "." + handlerDir.Replace(Path.DirectorySeparatorChar, '.'))}";
            
            handlerContent.Should().Contain($"namespace {expectedNamespace}",
                $"Command handler {Path.GetFileName(handlerFile)} should have namespace {expectedNamespace}");
        }
    }
}