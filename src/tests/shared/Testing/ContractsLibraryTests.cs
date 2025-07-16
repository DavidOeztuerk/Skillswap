using Xunit;
using System.Reflection;
using System.IO;
using FluentAssertions;

namespace Testing;

public class ContractsLibraryTests
{
    private readonly string _contractsPath = "/home/ditss/Source/Repos/Skillswap/src/shared/Contracts";

    [Fact]
    public void Contracts_Should_BeOrganizedByService()
    {
        // Arrange
        var expectedServiceFolders = new[]
        {
            "User",
            "Skill",
            "Appointment", 
            "Matchmaking",
            "VideoCall",
            "Notification"
        };

        // Act & Assert
        foreach (var service in expectedServiceFolders)
        {
            var servicePath = Path.Combine(_contractsPath, service);
            Directory.Exists(servicePath).Should().BeTrue($"Service folder {service} should exist in Contracts");
        }
    }

    [Fact]
    public void Contracts_Should_HaveRequestAndResponseFolders()
    {
        // Arrange
        var services = new[] { "User", "Skill", "Appointment", "Matchmaking", "VideoCall", "Notification" };

        // Act & Assert
        foreach (var service in services)
        {
            var requestsPath = Path.Combine(_contractsPath, service, "Requests");
            var responsesPath = Path.Combine(_contractsPath, service, "Responses");
            
            Directory.Exists(requestsPath).Should().BeTrue($"{service} should have Requests folder");
            Directory.Exists(responsesPath).Should().BeTrue($"{service} should have Responses folder");
        }
    }

    [Fact]
    public void AllRequestModels_Should_EndWithRequest()
    {
        // Arrange
        var requestFiles = Directory.GetFiles(_contractsPath, "*Request.cs", SearchOption.AllDirectories);

        // Act & Assert
        foreach (var requestFile in requestFiles)
        {
            var fileName = Path.GetFileNameWithoutExtension(requestFile);
            fileName.Should().EndWith("Request", $"Request model {fileName} should end with 'Request'");
        }
    }

    [Fact]
    public void AllResponseModels_Should_EndWithResponse()
    {
        // Arrange
        var responseFiles = Directory.GetFiles(_contractsPath, "*Response.cs", SearchOption.AllDirectories);

        // Act & Assert
        foreach (var responseFile in responseFiles)
        {
            var fileName = Path.GetFileNameWithoutExtension(responseFile);
            fileName.Should().EndWith("Response", $"Response model {fileName} should end with 'Response'");
        }
    }

    [Fact]
    public void Contracts_Should_HaveProperNamespaces()
    {
        // Arrange
        var contractFiles = Directory.GetFiles(_contractsPath, "*.cs", SearchOption.AllDirectories);

        // Act & Assert
        foreach (var contractFile in contractFiles)
        {
            var content = File.ReadAllText(contractFile);
            var relativePath = Path.GetDirectoryName(contractFile)?.Replace(_contractsPath, "").Trim('/', '\\');
            var expectedNamespace = $"Contracts{(string.IsNullOrEmpty(relativePath) ? "" : "." + relativePath.Replace(Path.DirectorySeparatorChar, '.'))}";
            
            content.Should().Contain($"namespace {expectedNamespace}",
                $"Contract {Path.GetFileName(contractFile)} should have namespace {expectedNamespace}");
        }
    }

    [Fact]
    public void Requests_Should_HaveValidation()
    {
        // Arrange
        var requestFiles = Directory.GetFiles(_contractsPath, "*Request.cs", SearchOption.AllDirectories);

        // Act & Assert
        foreach (var requestFile in requestFiles)
        {
            var content = File.ReadAllText(requestFile);
            var fileName = Path.GetFileNameWithoutExtension(requestFile);
            
            // Should have validation attributes or validator
            (content.Should().Contain("Required") |
             content.Should().Contain("Validator") |
             content.Should().Contain("ValidationAttribute") |
             content.Should().Contain("FluentValidation"))
                .Which.Should().NotBeNull($"Request {fileName} should have validation support");
        }
    }

    [Fact]
    public void Contracts_Should_NotHaveDependencies()
    {
        // Arrange
        var contractFiles = Directory.GetFiles(_contractsPath, "*.cs", SearchOption.AllDirectories);

        // Act & Assert
        foreach (var contractFile in contractFiles)
        {
            var content = File.ReadAllText(contractFile);
            var fileName = Path.GetFileNameWithoutExtension(contractFile);
            
            // Should not reference domain entities or infrastructure
            content.Should().NotContain("using UserService.Domain", $"Contract {fileName} should not reference domain entities");
            content.Should().NotContain("using SkillService.Domain", $"Contract {fileName} should not reference domain entities");
            content.Should().NotContain("using Infrastructure.Models", $"Contract {fileName} should not reference infrastructure models");
            content.Should().NotContain("DbContext", $"Contract {fileName} should not reference DbContext");
        }
    }

    [Fact]
    public void UserContracts_Should_Exist()
    {
        // Arrange
        var expectedUserRequests = new[]
        {
            "RegisterUserRequest.cs",
            "LoginUserRequest.cs",
            "RefreshTokenRequest.cs",
            "UpdateUserProfileRequest.cs",
            "ChangePasswordRequest.cs",
            "ResetPasswordRequest.cs",
            "VerifyEmailRequest.cs",
            "GetUserProfileRequest.cs",
            "SearchUsersRequest.cs"
        };

        var expectedUserResponses = new[]
        {
            "RegisterUserResponse.cs",
            "LoginUserResponse.cs",
            "RefreshTokenResponse.cs",
            "UpdateUserProfileResponse.cs",
            "UserProfileResponse.cs",
            "SearchUsersResponse.cs",
            "UserSummaryResponse.cs"
        };

        var userRequestsPath = Path.Combine(_contractsPath, "User", "Requests");
        var userResponsesPath = Path.Combine(_contractsPath, "User", "Responses");

        // Act & Assert
        foreach (var request in expectedUserRequests)
        {
            var filePath = Path.Combine(userRequestsPath, request);
            File.Exists(filePath).Should().BeTrue($"User request {request} should exist");
        }

        foreach (var response in expectedUserResponses)
        {
            var filePath = Path.Combine(userResponsesPath, response);
            File.Exists(filePath).Should().BeTrue($"User response {response} should exist");
        }
    }

    [Fact]
    public void SkillContracts_Should_Exist()
    {
        // Arrange
        var expectedSkillRequests = new[]
        {
            "CreateSkillRequest.cs",
            "UpdateSkillRequest.cs",
            "SearchSkillsRequest.cs",
            "GetSkillDetailsRequest.cs",
            "EndorseSkillRequest.cs",
            "RateSkillRequest.cs"
        };

        var expectedSkillResponses = new[]
        {
            "CreateSkillResponse.cs",
            "UpdateSkillResponse.cs",
            "SearchSkillsResponse.cs",
            "SkillDetailsResponse.cs",
            "SkillSummaryResponse.cs"
        };

        var skillRequestsPath = Path.Combine(_contractsPath, "Skill", "Requests");
        var skillResponsesPath = Path.Combine(_contractsPath, "Skill", "Responses");

        // Act & Assert
        foreach (var request in expectedSkillRequests)
        {
            var filePath = Path.Combine(skillRequestsPath, request);
            File.Exists(filePath).Should().BeTrue($"Skill request {request} should exist");
        }

        foreach (var response in expectedSkillResponses)
        {
            var filePath = Path.Combine(skillResponsesPath, response);
            File.Exists(filePath).Should().BeTrue($"Skill response {response} should exist");
        }
    }

    [Fact]
    public void Contracts_Should_SupportVersioning()
    {
        // Arrange
        var contractFiles = Directory.GetFiles(_contractsPath, "*.cs", SearchOption.AllDirectories);

        // Act & Assert
        foreach (var contractFile in contractFiles)
        {
            var content = File.ReadAllText(contractFile);
            var fileName = Path.GetFileNameWithoutExtension(contractFile);
            
            // Should have API versioning support
            (content.Should().Contain("ApiVersion") |
             content.Should().Contain("Version") |
             content.Should().Contain("v1") |
             content.Should().Contain("V1"))
                .Which.Should().NotBeNull($"Contract {fileName} should support API versioning");
        }
    }

    [Fact]
    public void Contracts_Should_HaveDocumentation()
    {
        // Arrange
        var contractFiles = Directory.GetFiles(_contractsPath, "*.cs", SearchOption.AllDirectories);

        // Act & Assert
        foreach (var contractFile in contractFiles)
        {
            var content = File.ReadAllText(contractFile);
            var fileName = Path.GetFileNameWithoutExtension(contractFile);
            
            // Should have XML documentation
            (content.Should().Contain("/// <summary>") |
             content.Should().Contain("/// <param") |
             content.Should().Contain("/// <returns>"))
                .Which.Should().NotBeNull($"Contract {fileName} should have XML documentation");
        }
    }
}