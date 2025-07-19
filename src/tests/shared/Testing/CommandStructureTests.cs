//using Xunit;
//using System.Reflection;
//using System.IO;
//using FluentAssertions;

//namespace Testing;

//public class CommandStructureTests
//{
//    private readonly string _sharedPath = "/home/ditss/Source/Repos/Skillswap/src/shared";
//    private readonly string _servicesPath = "/home/ditss/Source/Repos/Skillswap/src/services";

//    [Fact]
//    public void Commands_Should_BeOrganizedInProperSharedFolder()
//    {
//        // Arrange
//        var expectedFolders = new[]
//        {
//            "Commands",
//            "Commands/User",
//            "Commands/Skill", 
//            "Commands/Appointment",
//            "Commands/Matchmaking",
//            "Commands/VideoCall",
//            "Commands/Notification"
//        };

//        // Act & Assert
//        foreach (var folder in expectedFolders)
//        {
//            var folderPath = Path.Combine(_sharedPath, folder);
//            Directory.Exists(folderPath).Should().BeTrue($"Folder {folder} should exist in shared directory");
//        }
//    }

//    [Fact]
//    public void CommandHandlers_Should_BeOrganizedInProperSharedFolder()
//    {
//        // Arrange
//        var expectedFolders = new[]
//        {
//            "CommandHandlers",
//            "CommandHandlers/User",
//            "CommandHandlers/Skill", 
//            "CommandHandlers/Appointment",
//            "CommandHandlers/Matchmaking",
//            "CommandHandlers/VideoCall",
//            "CommandHandlers/Notification"
//        };

//        // Act & Assert
//        foreach (var folder in expectedFolders)
//        {
//            var folderPath = Path.Combine(_sharedPath, folder);
//            Directory.Exists(folderPath).Should().BeTrue($"Folder {folder} should exist in shared directory");
//        }
//    }

//    [Fact]
//    public void AllCommands_Should_ImplementICommand()
//    {
//        // Arrange
//        var commandFiles = Directory.GetFiles(Path.Combine(_sharedPath, "Commands"), "*Command.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        commandFiles.Should().NotBeEmpty("There should be command files in the Commands directory");

//        foreach (var commandFile in commandFiles)
//        {
//            var content = File.ReadAllText(commandFile);
//            var fileName = Path.GetFileNameWithoutExtension(commandFile);
            
//            // Should implement ICommand interface
//            (content.Should().Contain(": ICommand") | content.Should().Contain(": ICommand<"))
//                .Which.Should().NotBeNull($"Command {fileName} should implement ICommand interface");
//        }
//    }

//    [Fact]
//    public void AllCommandHandlers_Should_ImplementICommandHandler()
//    {
//        // Arrange
//        var handlerFiles = Directory.GetFiles(Path.Combine(_sharedPath, "CommandHandlers"), "*CommandHandler.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        handlerFiles.Should().NotBeEmpty("There should be command handler files in the CommandHandlers directory");

//        foreach (var handlerFile in handlerFiles)
//        {
//            var content = File.ReadAllText(handlerFile);
//            var fileName = Path.GetFileNameWithoutExtension(handlerFile);
            
//            // Should implement ICommandHandler interface
//            (content.Should().Contain(": ICommandHandler") | content.Should().Contain(": BaseCommandHandler"))
//                .Which.Should().NotBeNull($"Command handler {fileName} should implement ICommandHandler or inherit from BaseCommandHandler");
//        }
//    }

//    [Fact]
//    public void Commands_Should_HaveProperNaming()
//    {
//        // Arrange
//        var commandsPath = Path.Combine(_sharedPath, "Commands");
//        if (!Directory.Exists(commandsPath)) return;

//        var commandFiles = Directory.GetFiles(commandsPath, "*.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var commandFile in commandFiles)
//        {
//            var fileName = Path.GetFileNameWithoutExtension(commandFile);
//            fileName.Should().EndWith("Command", $"Command {fileName} should end with 'Command'");
//        }
//    }

//    [Fact]
//    public void CommandHandlers_Should_HaveProperNaming()
//    {
//        // Arrange
//        var handlersPath = Path.Combine(_sharedPath, "CommandHandlers");
//        if (!Directory.Exists(handlersPath)) return;

//        var handlerFiles = Directory.GetFiles(handlersPath, "*.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var handlerFile in handlerFiles)
//        {
//            var fileName = Path.GetFileNameWithoutExtension(handlerFile);
//            fileName.Should().EndWith("CommandHandler", $"Command handler {fileName} should end with 'CommandHandler'");
//        }
//    }

//    [Fact]
//    public void Commands_Should_HaveValidation()
//    {
//        // Arrange
//        var commandsPath = Path.Combine(_sharedPath, "Commands");
//        if (!Directory.Exists(commandsPath)) return;

//        var commandFiles = Directory.GetFiles(commandsPath, "*Command.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var commandFile in commandFiles)
//        {
//            var content = File.ReadAllText(commandFile);
//            var fileName = Path.GetFileNameWithoutExtension(commandFile);
            
//            // Should have validation attributes or validator class reference
//            (content.Should().Contain("ValidationBehavior") | 
//             content.Should().Contain("FluentValidation") | 
//             content.Should().Contain("Required") |
//             content.Should().Contain("Validator"))
//                .Which.Should().NotBeNull($"Command {fileName} should have validation support");
//        }
//    }

//    [Fact]
//    public void Commands_Should_HaveAuditingSupport()
//    {
//        // Arrange
//        var commandsPath = Path.Combine(_sharedPath, "Commands");
//        if (!Directory.Exists(commandsPath)) return;

//        var commandFiles = Directory.GetFiles(commandsPath, "*Command.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var commandFile in commandFiles)
//        {
//            var content = File.ReadAllText(commandFile);
//            var fileName = Path.GetFileNameWithoutExtension(commandFile);
            
//            // Should implement IAuditableCommand or have audit properties
//            (content.Should().Contain("IAuditableCommand") | 
//             content.Should().Contain("UserId") |
//             content.Should().Contain("Timestamp"))
//                .Which.Should().NotBeNull($"Command {fileName} should support auditing");
//        }
//    }

//    [Fact]
//    public void CommandHandlers_Should_UseAsyncPattern()
//    {
//        // Arrange
//        var handlersPath = Path.Combine(_sharedPath, "CommandHandlers");
//        if (!Directory.Exists(handlersPath)) return;

//        var handlerFiles = Directory.GetFiles(handlersPath, "*CommandHandler.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var handlerFile in handlerFiles)
//        {
//            var content = File.ReadAllText(handlerFile);
//            var fileName = Path.GetFileNameWithoutExtension(handlerFile);
            
//            // Should use async/await pattern
//            (content.Should().Contain("async") & content.Should().Contain("await"))
//                .Which.Should().NotBeNull($"Command handler {fileName} should use async/await pattern");
//        }
//    }

//    [Fact]
//    public void ServiceCommands_Should_BeMovedToShared()
//    {
//        // Arrange
//        var serviceCommandPaths = new[]
//        {
//            "/home/ditss/Source/Repos/Skillswap/src/services/UserService/Application/Commands",
//            "/home/ditss/Source/Repos/Skillswap/src/services/SkillService/Application/Commands",
//            "/home/ditss/Source/Repos/Skillswap/src/services/MatchmakingService/Application/Commands",
//            "/home/ditss/Source/Repos/Skillswap/src/services/AppointmentService/Application/Commands",
//            "/home/ditss/Source/Repos/Skillswap/src/services/NotificationService/Application/Commands",
//            "/home/ditss/Source/Repos/Skillswap/src/services/VideocallService/Application/Commands"
//        };

//        // Act & Assert
//        foreach (var servicePath in serviceCommandPaths)
//        {
//            if (!Directory.Exists(servicePath)) continue;

//            var commandFiles = Directory.GetFiles(servicePath, "*Command.cs", SearchOption.AllDirectories);
//            commandFiles.Should().BeEmpty($"Service path {servicePath} should be empty after migration to shared");
//        }
//    }

//    [Fact]
//    public void ServiceCommandHandlers_Should_BeMovedToShared()
//    {
//        // Arrange
//        var serviceHandlerPaths = new[]
//        {
//            "/home/ditss/Source/Repos/Skillswap/src/services/UserService/Application/CommandHandlers",
//            "/home/ditss/Source/Repos/Skillswap/src/services/SkillService/Application/CommandHandlers",
//            "/home/ditss/Source/Repos/Skillswap/src/services/MatchmakingService/Application/CommandHandlers",
//            "/home/ditss/Source/Repos/Skillswap/src/services/AppointmentService/Application/CommandHandlers",
//            "/home/ditss/Source/Repos/Skillswap/src/services/NotificationService/Application/CommandHandlers",
//            "/home/ditss/Source/Repos/Skillswap/src/services/VideocallService/Application/CommandHandlers"
//        };

//        // Act & Assert
//        foreach (var servicePath in serviceHandlerPaths)
//        {
//            if (!Directory.Exists(servicePath)) continue;

//            var handlerFiles = Directory.GetFiles(servicePath, "*CommandHandler.cs", SearchOption.AllDirectories);
//            handlerFiles.Should().BeEmpty($"Service path {servicePath} should be empty after migration to shared");
//        }
//    }
//}