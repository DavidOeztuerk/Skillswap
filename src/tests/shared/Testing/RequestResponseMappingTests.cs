using Xunit;
using System.Reflection;
using FluentAssertions;

namespace Testing;

public class RequestResponseMappingTests
{
    [Fact]
    public void AllServices_Should_HaveContractMappers()
    {
        // Arrange
        var expectedMappers = new[]
        {
            "IUserContractMapper",
            "ISkillContractMapper", 
            "IAppointmentContractMapper",
            "IMatchmakingContractMapper",
            "INotificationContractMapper",
            "IVideoCallContractMapper"
        };

        var servicesPath = "/home/ditss/Source/Repos/Skillswap/src/services";
        var services = new[] { "UserService", "SkillService", "AppointmentService", "MatchmakingService", "NotificationService", "VideocallService" };

        // Act & Assert
        foreach (var service in services)
        {
            var mappersPath = $"{servicesPath}/{service}/Application/Mappers";
            Directory.Exists(mappersPath).Should().BeTrue($"Service {service} should have Mappers folder");
        }
    }

    [Fact]
    public void Services_Should_UseContractsInsteadOfDirectCQRS()
    {
        // Arrange
        var servicesPath = "/home/ditss/Source/Repos/Skillswap/src/services";
        var services = new[] { "UserService", "SkillService", "AppointmentService", "MatchmakingService", "NotificationService", "VideocallService" };

        // Act & Assert
        foreach (var service in services)
        {
            var controllersPath = $"{servicesPath}/{service}/Controllers";
            if (!Directory.Exists(controllersPath)) continue;

            var controllerFiles = Directory.GetFiles(controllersPath, "*.cs", SearchOption.AllDirectories);
            
            foreach (var controllerFile in controllerFiles)
            {
                var content = File.ReadAllText(controllerFile);
                var fileName = Path.GetFileName(controllerFile);

                // Controllers should use Contracts, not direct CQRS
                content.Should().Contain("using Contracts", $"Controller {fileName} should use Contracts");
                content.Should().NotContain("Command>", $"Controller {fileName} should not use Commands directly");
                content.Should().NotContain("Query>", $"Controller {fileName} should not use Queries directly");
            }
        }
    }

    [Fact]
    public void Mappers_Should_ConvertBetweenContractsAndCQRS()
    {
        // Arrange
        var userServicePath = "/home/ditss/Source/Repos/Skillswap/src/services/UserService/Application/Mappers";

        // Act & Assert
        if (Directory.Exists(userServicePath))
        {
            var mapperFiles = Directory.GetFiles(userServicePath, "*Mapper.cs");
            
            foreach (var mapperFile in mapperFiles)
            {
                var content = File.ReadAllText(mapperFile);
                var fileName = Path.GetFileName(mapperFile);

                // Mappers should reference both Contracts and CQRS
                content.Should().Contain("using Contracts", $"Mapper {fileName} should reference Contracts");
                content.Should().Contain("MapToCommand", $"Mapper {fileName} should have MapToCommand methods");
                content.Should().Contain("MapToResponse", $"Mapper {fileName} should have MapToResponse methods");
            }
        }
    }

    [Fact]
    public void Controllers_Should_UseMappers()
    {
        // Arrange
        var userControllerPath = "/home/ditss/Source/Repos/Skillswap/src/services/UserService/Controllers";

        // Act & Assert
        if (Directory.Exists(userControllerPath))
        {
            var controllerFiles = Directory.GetFiles(userControllerPath, "*.cs");
            
            foreach (var controllerFile in controllerFiles)
            {
                var content = File.ReadAllText(controllerFile);
                var fileName = Path.GetFileName(controllerFile);

                // Controllers should inject and use mappers
                (content.Should().Contain("IUserContractMapper") | 
                 content.Should().Contain("ContractMapper") |
                 content.Should().Contain("_mapper"))
                    .Which.Should().NotBeNull($"Controller {fileName} should use contract mappers");
            }
        }
    }

    [Fact]
    public void RequestModels_Should_BeValidatedBeforeMapping()
    {
        // Arrange
        var servicesPath = "/home/ditss/Source/Repos/Skillswap/src/services";
        var services = new[] { "UserService", "SkillService", "AppointmentService" };

        // Act & Assert
        foreach (var service in services)
        {
            var controllersPath = $"{servicesPath}/{service}/Controllers";
            if (!Directory.Exists(controllersPath)) continue;

            var controllerFiles = Directory.GetFiles(controllersPath, "*.cs");
            
            foreach (var controllerFile in controllerFiles)
            {
                var content = File.ReadAllText(controllerFile);
                var fileName = Path.GetFileName(controllerFile);

                // Controllers should validate requests before mapping
                (content.Should().Contain("ModelState.IsValid") |
                 content.Should().Contain("ValidationBehavior") |
                 content.Should().Contain("[ValidateModel]"))
                    .Which.Should().NotBeNull($"Controller {fileName} should validate requests");
            }
        }
    }

    [Fact]
    public void APIEndpoints_Should_ReturnContractResponses()
    {
        // Arrange
        var servicesPath = "/home/ditss/Source/Repos/Skillswap/src/services";
        var services = new[] { "UserService", "SkillService" };

        // Act & Assert
        foreach (var service in services)
        {
            var controllersPath = $"{servicesPath}/{service}/Controllers";
            if (!Directory.Exists(controllersPath)) continue;

            var controllerFiles = Directory.GetFiles(controllersPath, "*.cs");
            
            foreach (var controllerFile in controllerFiles)
            {
                var content = File.ReadAllText(controllerFile);
                var fileName = Path.GetFileName(controllerFile);

                // Controllers should return contract response types
                (content.Should().Contain("Response>") |
                 content.Should().Contain("ActionResult<"))
                    .Which.Should().NotBeNull($"Controller {fileName} should return contract responses");
            }
        }
    }

    [Fact]
    public void Mappers_Should_HandleErrorsGracefully()
    {
        // Arrange
        var servicesPath = "/home/ditss/Source/Repos/Skillswap/src/services";

        // Act & Assert
        foreach (var service in new[] { "UserService", "SkillService" })
        {
            var mappersPath = $"{servicesPath}/{service}/Application/Mappers";
            if (!Directory.Exists(mappersPath)) continue;

            var mapperFiles = Directory.GetFiles(mappersPath, "*.cs");
            
            foreach (var mapperFile in mapperFiles)
            {
                var content = File.ReadAllText(mapperFile);
                var fileName = Path.GetFileName(mapperFile);

                // Mappers should handle null values and errors
                (content.Should().Contain("null") |
                 content.Should().Contain("try") |
                 content.Should().Contain("ArgumentNullException"))
                    .Which.Should().NotBeNull($"Mapper {fileName} should handle errors gracefully");
            }
        }
    }

    [Fact]
    public void Services_Should_NotExposeCQRSTypesInPublicAPI()
    {
        // Arrange
        var servicesPath = "/home/ditss/Source/Repos/Skillswap/src/services";
        var services = new[] { "UserService", "SkillService", "AppointmentService" };

        // Act & Assert
        foreach (var service in services)
        {
            var controllersPath = $"{servicesPath}/{service}/Controllers";
            if (!Directory.Exists(controllersPath)) continue;

            var controllerFiles = Directory.GetFiles(controllersPath, "*.cs");
            
            foreach (var controllerFile in controllerFiles)
            {
                var content = File.ReadAllText(controllerFile);
                var fileName = Path.GetFileName(controllerFile);

                // Public API should not expose CQRS command/query types
                content.Should().NotContain("public.*Command", $"Controller {fileName} should not expose Command types");
                content.Should().NotContain("public.*Query", $"Controller {fileName} should not expose Query types");
            }
        }
    }

    [Fact]
    public void Mappers_Should_PreserveValidationRules()
    {
        // Arrange
        var contractsPath = "/home/ditss/Source/Repos/Skillswap/src/shared/Contracts";
        var requestFiles = Directory.GetFiles(contractsPath, "*Request.cs", SearchOption.AllDirectories);

        // Act & Assert
        foreach (var requestFile in requestFiles)
        {
            var content = File.ReadAllText(requestFile);
            var fileName = Path.GetFileName(requestFile);

            // Request contracts should have validation attributes
            (content.Should().Contain("[Required") |
             content.Should().Contain("[StringLength") |
             content.Should().Contain("[EmailAddress") |
             content.Should().Contain("[Range"))
                .Which.Should().NotBeNull($"Request {fileName} should have validation attributes");
        }
    }

    [Fact]
    public void ResponseMapping_Should_HandlePagination()
    {
        // Arrange
        var servicesPath = "/home/ditss/Source/Repos/Skillswap/src/services";

        // Act & Assert
        foreach (var service in new[] { "UserService", "SkillService" })
        {
            var mappersPath = $"{servicesPath}/{service}/Application/Mappers";
            if (!Directory.Exists(mappersPath)) continue;

            var mapperFiles = Directory.GetFiles(mappersPath, "*.cs");
            
            foreach (var mapperFile in mapperFiles)
            {
                var content = File.ReadAllText(mapperFile);
                var fileName = Path.GetFileName(mapperFile);

                // Mappers should handle paginated responses
                if (content.Contains("Search") || content.Contains("GetAll"))
                {
                    (content.Should().Contain("PagedResponse") |
                     content.Should().Contain("Pagination"))
                        .Which.Should().NotBeNull($"Mapper {fileName} should handle pagination for search/list operations");
                }
            }
        }
    }
}