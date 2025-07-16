using Xunit;
using System.IO;
using FluentAssertions;

namespace Testing;

public class QueryMigrationTests
{
    private readonly string _sharedPath = "/home/ditss/Source/Repos/Skillswap/src/shared";

    [Fact]
    public void AllUserQueries_Should_BeMigrated()
    {
        // Arrange
        var expectedUserQueries = new[]
        {
            "GetUserProfileQuery.cs",
            "SearchUsersQuery.cs",
            "GetUserByEmailQuery.cs",
            "CheckEmailAvailabilityQuery.cs",
            "ValidateUserCredentialsQuery.cs",
            "GetUserStatisticsQuery.cs",
            "GetUserRolesQuery.cs",
            "GetUserActivityLogQuery.cs",
            "GetFavoriteSkillsQuery.cs",
            "GetAllUsersQuery.cs",
            "GetBlockedUsersQuery.cs",
            "GetPublicUserProfileQuery.cs",
            "GetUserAvailabilityQuery.cs",
            "GetNotificationPreferencesQuery.cs",
            "GetTwoFactorStatusQuery.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Queries", "User");

        // Act & Assert
        foreach (var query in expectedUserQueries)
        {
            var filePath = Path.Combine(expectedPath, query);
            File.Exists(filePath).Should().BeTrue($"User query {query} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllSkillQueries_Should_BeMigrated()
    {
        // Arrange
        var expectedSkillQueries = new[]
        {
            "SearchSkillsQuery.cs",
            "GetSkillDetailsQuery.cs",
            "GetUserSkillsQuery.cs",
            "GetSkillCategoriesQuery.cs",
            "GetProficiencyLevelsQuery.cs",
            "GetSkillStatisticsQuery.cs",
            "GetSkillRecommendationsQuery.cs",
            "GetPopularTagsQuery.cs",
            "GetSkillAnalyticsQuery.cs",
            "GetSkillExportDataQuery.cs",
            "GetSkillLearningPathQuery.cs",
            "GetSkillReviewsQuery.cs",
            "SearchSimilarSkillsQuery.cs",
            "ValidateSkillNameQuery.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Queries", "Skill");

        // Act & Assert
        foreach (var query in expectedSkillQueries)
        {
            var filePath = Path.Combine(expectedPath, query);
            File.Exists(filePath).Should().BeTrue($"Skill query {query} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllNotificationQueries_Should_BeMigrated()
    {
        // Arrange
        var expectedNotificationQueries = new[]
        {
            "GetNotificationHistoryQuery.cs",
            "GetNotificationPreferencesQuery.cs",
            "GetNotificationStatisticsQuery.cs",
            "GetEmailTemplatesQuery.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Queries", "Notification");

        // Act & Assert
        foreach (var query in expectedNotificationQueries)
        {
            var filePath = Path.Combine(expectedPath, query);
            File.Exists(filePath).Should().BeTrue($"Notification query {query} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllMatchmakingQueries_Should_BeMigrated()
    {
        // Arrange
        var expectedMatchmakingQueries = new[]
        {
            "GetUserMatchesQuery.cs",
            "GetMatchDetailsQuery.cs",
            "GetIncomingMatchRequestsQuery.cs",
            "GetOutgoingMatchRequestsQuery.cs",
            "GetMatchStatisticsQuery.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Queries", "Matchmaking");

        // Act & Assert
        foreach (var query in expectedMatchmakingQueries)
        {
            var filePath = Path.Combine(expectedPath, query);
            File.Exists(filePath).Should().BeTrue($"Matchmaking query {query} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllAppointmentQueries_Should_BeMigrated()
    {
        // Arrange
        var expectedAppointmentQueries = new[]
        {
            "GetUserAppointmentsQuery.cs",
            "GetAppointmentDetailsQuery.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Queries", "Appointment");

        // Act & Assert
        foreach (var query in expectedAppointmentQueries)
        {
            var filePath = Path.Combine(expectedPath, query);
            File.Exists(filePath).Should().BeTrue($"Appointment query {query} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllVideoCallQueries_Should_BeMigrated()
    {
        // Arrange
        var expectedVideoCallQueries = new[]
        {
            "GetCallSessionQuery.cs",
            "GetCallStatisticsQuery.cs",
            "GetUserCallHistoryQuery.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "Queries", "VideoCall");

        // Act & Assert
        foreach (var query in expectedVideoCallQueries)
        {
            var filePath = Path.Combine(expectedPath, query);
            File.Exists(filePath).Should().BeTrue($"VideoCall query {query} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllUserQueryHandlers_Should_BeMigrated()
    {
        // Arrange
        var expectedUserHandlers = new[]
        {
            "GetUserProfileQueryHandler.cs",
            "SearchUsersQueryHandler.cs",
            "GetUserByEmailQueryHandler.cs",
            "CheckEmailAvailabilityQueryHandler.cs",
            "ValidateUserCredentialsQueryHandler.cs",
            "GetUserStatisticsQueryHandler.cs",
            "GetUserRolesQueryHandler.cs",
            "GetUserActivityLogQueryHandler.cs",
            "GetFavoriteSkillsQueryHandler.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "QueryHandlers", "User");

        // Act & Assert
        foreach (var handler in expectedUserHandlers)
        {
            var filePath = Path.Combine(expectedPath, handler);
            File.Exists(filePath).Should().BeTrue($"User query handler {handler} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void AllSkillQueryHandlers_Should_BeMigrated()
    {
        // Arrange
        var expectedSkillHandlers = new[]
        {
            "SearchSkillsQueryHandler.cs",
            "GetSkillDetailsQueryHandler.cs",
            "GetUserSkillsQueryHandler.cs",
            "GetSkillCategoriesQueryHandler.cs",
            "GetProficiencyLevelsQueryHandler.cs",
            "GetSkillStatisticsQueryHandler.cs",
            "GetSkillRecommendationsQueryHandler.cs",
            "GetPopularTagsQueryHandler.cs"
        };

        var expectedPath = Path.Combine(_sharedPath, "QueryHandlers", "Skill");

        // Act & Assert
        foreach (var handler in expectedSkillHandlers)
        {
            var filePath = Path.Combine(expectedPath, handler);
            File.Exists(filePath).Should().BeTrue($"Skill query handler {handler} should be migrated to {filePath}");
        }
    }

    [Fact]
    public void QueriesAndHandlers_Should_HaveMatchingNamespaces()
    {
        // Arrange
        var queriesPath = Path.Combine(_sharedPath, "Queries");
        var handlersPath = Path.Combine(_sharedPath, "QueryHandlers");

        if (!Directory.Exists(queriesPath) || !Directory.Exists(handlersPath)) return;

        var queryFiles = Directory.GetFiles(queriesPath, "*.cs", SearchOption.AllDirectories);
        var handlerFiles = Directory.GetFiles(handlersPath, "*.cs", SearchOption.AllDirectories);

        // Act & Assert
        foreach (var queryFile in queryFiles)
        {
            var queryContent = File.ReadAllText(queryFile);
            var queryDir = Path.GetDirectoryName(queryFile)?.Replace(queriesPath, "").Trim('/', '\\');
            var expectedNamespace = $"Queries{(string.IsNullOrEmpty(queryDir) ? "" : "." + queryDir.Replace(Path.DirectorySeparatorChar, '.'))}";
            
            queryContent.Should().Contain($"namespace {expectedNamespace}",
                $"Query {Path.GetFileName(queryFile)} should have namespace {expectedNamespace}");
        }

        foreach (var handlerFile in handlerFiles)
        {
            var handlerContent = File.ReadAllText(handlerFile);
            var handlerDir = Path.GetDirectoryName(handlerFile)?.Replace(handlersPath, "").Trim('/', '\\');
            var expectedNamespace = $"QueryHandlers{(string.IsNullOrEmpty(handlerDir) ? "" : "." + handlerDir.Replace(Path.DirectorySeparatorChar, '.'))}";
            
            handlerContent.Should().Contain($"namespace {expectedNamespace}",
                $"Query handler {Path.GetFileName(handlerFile)} should have namespace {expectedNamespace}");
        }
    }

    [Fact]
    public void MissingQueryHandlers_Should_BeCreated()
    {
        // Arrange - These are the queries that currently don't have handlers
        var missingHandlers = new Dictionary<string, string[]>
        {
            ["User"] = new[]
            {
                "GetAllUsersQueryHandler.cs",
                "GetBlockedUsersQueryHandler.cs",
                "GetPublicUserProfileQueryHandler.cs",
                "GetUserAvailabilityQueryHandler.cs",
                "GetNotificationPreferencesQueryHandler.cs",
                "GetTwoFactorStatusQueryHandler.cs"
            },
            ["Skill"] = new[]
            {
                "GetSkillAnalyticsQueryHandler.cs",
                "GetSkillExportDataQueryHandler.cs",
                "GetSkillLearningPathQueryHandler.cs",
                "GetSkillReviewsQueryHandler.cs",
                "SearchSimilarSkillsQueryHandler.cs",
                "ValidateSkillNameQueryHandler.cs"
            },
            ["VideoCall"] = new[]
            {
                "GetCallSessionQueryHandler.cs",
                "GetCallStatisticsQueryHandler.cs",
                "GetUserCallHistoryQueryHandler.cs"
            }
        };

        // Act & Assert
        foreach (var category in missingHandlers.Keys)
        {
            var handlersPath = Path.Combine(_sharedPath, "QueryHandlers", category);
            
            foreach (var expectedHandler in missingHandlers[category])
            {
                var handlerPath = Path.Combine(handlersPath, expectedHandler);
                File.Exists(handlerPath).Should().BeTrue(
                    $"Missing query handler {expectedHandler} should be created in {category}");
            }
        }
    }

    [Fact]
    public void ResponseModels_Should_BeMigratedToShared()
    {
        // Arrange
        var expectedResponseModelsPath = Path.Combine(_sharedPath, "Models", "Responses");
        
        var expectedResponseCategories = new[]
        {
            "User",
            "Skill", 
            "Notification",
            "Matchmaking",
            "Appointment",
            "VideoCall"
        };

        // Act & Assert
        Directory.Exists(expectedResponseModelsPath).Should().BeTrue(
            "Response models directory should exist in shared");
            
        foreach (var category in expectedResponseCategories)
        {
            var categoryPath = Path.Combine(expectedResponseModelsPath, category);
            Directory.Exists(categoryPath).Should().BeTrue(
                $"Response models category {category} should exist");
        }
    }
}