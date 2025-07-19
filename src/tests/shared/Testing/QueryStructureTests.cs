//using Xunit;
//using System.Reflection;
//using System.IO;
//using FluentAssertions;

//namespace Testing;

//public class QueryStructureTests
//{
//    private readonly string _sharedPath = "/home/ditss/Source/Repos/Skillswap/src/shared";
//    private readonly string _servicesPath = "/home/ditss/Source/Repos/Skillswap/src/services";

//    [Fact]
//    public void Queries_Should_BeOrganizedInProperSharedFolder()
//    {
//        // Arrange
//        var expectedFolders = new[]
//        {
//            "Queries",
//            "Queries/User",
//            "Queries/Skill", 
//            "Queries/Appointment",
//            "Queries/Matchmaking",
//            "Queries/VideoCall",
//            "Queries/Notification"
//        };

//        // Act & Assert
//        foreach (var folder in expectedFolders)
//        {
//            var folderPath = Path.Combine(_sharedPath, folder);
//            Directory.Exists(folderPath).Should().BeTrue($"Folder {folder} should exist in shared directory");
//        }
//    }

//    [Fact]
//    public void QueryHandlers_Should_BeOrganizedInProperSharedFolder()
//    {
//        // Arrange
//        var expectedFolders = new[]
//        {
//            "QueryHandlers",
//            "QueryHandlers/User",
//            "QueryHandlers/Skill", 
//            "QueryHandlers/Appointment",
//            "QueryHandlers/Matchmaking",
//            "QueryHandlers/VideoCall",
//            "QueryHandlers/Notification"
//        };

//        // Act & Assert
//        foreach (var folder in expectedFolders)
//        {
//            var folderPath = Path.Combine(_sharedPath, folder);
//            Directory.Exists(folderPath).Should().BeTrue($"Folder {folder} should exist in shared directory");
//        }
//    }

//    [Fact]
//    public void AllQueries_Should_ImplementIQuery()
//    {
//        // Arrange
//        var queriesPath = Path.Combine(_sharedPath, "Queries");
//        if (!Directory.Exists(queriesPath)) return;

//        var queryFiles = Directory.GetFiles(queriesPath, "*Query.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        queryFiles.Should().NotBeEmpty("There should be query files in the Queries directory");

//        foreach (var queryFile in queryFiles)
//        {
//            var content = File.ReadAllText(queryFile);
//            var fileName = Path.GetFileNameWithoutExtension(queryFile);
            
//            // Should implement IQuery interface
//            (content.Should().Contain(": IQuery") | 
//             content.Should().Contain(": IPagedQuery") |
//             content.Should().Contain(": ICacheableQuery"))
//                .Which.Should().NotBeNull($"Query {fileName} should implement IQuery interface");
//        }
//    }

//    [Fact]
//    public void AllQueryHandlers_Should_ImplementIQueryHandler()
//    {
//        // Arrange
//        var handlersPath = Path.Combine(_sharedPath, "QueryHandlers");
//        if (!Directory.Exists(handlersPath)) return;

//        var handlerFiles = Directory.GetFiles(handlersPath, "*QueryHandler.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        handlerFiles.Should().NotBeEmpty("There should be query handler files in the QueryHandlers directory");

//        foreach (var handlerFile in handlerFiles)
//        {
//            var content = File.ReadAllText(handlerFile);
//            var fileName = Path.GetFileNameWithoutExtension(handlerFile);
            
//            // Should implement IQueryHandler interface
//            (content.Should().Contain(": IQueryHandler") | 
//             content.Should().Contain(": BaseQueryHandler") |
//             content.Should().Contain(": BasePagedQueryHandler"))
//                .Which.Should().NotBeNull($"Query handler {fileName} should implement IQueryHandler or inherit from base class");
//        }
//    }

//    [Fact]
//    public void Queries_Should_HaveProperNaming()
//    {
//        // Arrange
//        var queriesPath = Path.Combine(_sharedPath, "Queries");
//        if (!Directory.Exists(queriesPath)) return;

//        var queryFiles = Directory.GetFiles(queriesPath, "*.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var queryFile in queryFiles)
//        {
//            var fileName = Path.GetFileNameWithoutExtension(queryFile);
//            fileName.Should().EndWith("Query", $"Query {fileName} should end with 'Query'");
//        }
//    }

//    [Fact]
//    public void QueryHandlers_Should_HaveProperNaming()
//    {
//        // Arrange
//        var handlersPath = Path.Combine(_sharedPath, "QueryHandlers");
//        if (!Directory.Exists(handlersPath)) return;

//        var handlerFiles = Directory.GetFiles(handlersPath, "*.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var handlerFile in handlerFiles)
//        {
//            var fileName = Path.GetFileNameWithoutExtension(handlerFile);
//            fileName.Should().EndWith("QueryHandler", $"Query handler {fileName} should end with 'QueryHandler'");
//        }
//    }

//    [Fact]
//    public void Queries_Should_HaveCachingSupport()
//    {
//        // Arrange
//        var queriesPath = Path.Combine(_sharedPath, "Queries");
//        if (!Directory.Exists(queriesPath)) return;

//        var queryFiles = Directory.GetFiles(queriesPath, "*Query.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var queryFile in queryFiles)
//        {
//            var content = File.ReadAllText(queryFile);
//            var fileName = Path.GetFileNameWithoutExtension(queryFile);
            
//            // Should have caching support (either implement ICacheableQuery or have cache attributes)
//            (content.Should().Contain("ICacheableQuery") | 
//             content.Should().Contain("CacheKey") |
//             content.Should().Contain("CacheDuration") |
//             content.Should().Contain("Cacheable"))
//                .Which.Should().NotBeNull($"Query {fileName} should support caching");
//        }
//    }

//    [Fact]
//    public void PagedQueries_Should_ImplementIPagedQuery()
//    {
//        // Arrange
//        var queriesPath = Path.Combine(_sharedPath, "Queries");
//        if (!Directory.Exists(queriesPath)) return;

//        var pagedQueryFiles = Directory.GetFiles(queriesPath, "*Query.cs", SearchOption.AllDirectories)
//            .Where(f => File.ReadAllText(f).Contains("PageSize") || 
//                       File.ReadAllText(f).Contains("PageNumber") ||
//                       Path.GetFileNameWithoutExtension(f).Contains("Search") ||
//                       Path.GetFileNameWithoutExtension(f).Contains("GetAll"))
//            .ToArray();

//        // Act & Assert
//        foreach (var queryFile in pagedQueryFiles)
//        {
//            var content = File.ReadAllText(queryFile);
//            var fileName = Path.GetFileNameWithoutExtension(queryFile);
            
//            // Should implement IPagedQuery for paginated results
//            content.Should().Contain("IPagedQuery", 
//                $"Paged query {fileName} should implement IPagedQuery");
//        }
//    }

//    [Fact]
//    public void QueryHandlers_Should_UseAsyncPattern()
//    {
//        // Arrange
//        var handlersPath = Path.Combine(_sharedPath, "QueryHandlers");
//        if (!Directory.Exists(handlersPath)) return;

//        var handlerFiles = Directory.GetFiles(handlersPath, "*QueryHandler.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var handlerFile in handlerFiles)
//        {
//            var content = File.ReadAllText(handlerFile);
//            var fileName = Path.GetFileNameWithoutExtension(handlerFile);
            
//            // Should use async/await pattern
//            (content.Should().Contain("async") & content.Should().Contain("await"))
//                .Which.Should().NotBeNull($"Query handler {fileName} should use async/await pattern");
//        }
//    }

//    [Fact]
//    public void ServiceQueries_Should_BeMovedToShared()
//    {
//        // Arrange
//        var serviceQueryPaths = new[]
//        {
//            "/home/ditss/Source/Repos/Skillswap/src/services/UserService/Application/Queries",
//            "/home/ditss/Source/Repos/Skillswap/src/services/SkillService/Application/Queries",
//            "/home/ditss/Source/Repos/Skillswap/src/services/MatchmakingService/Application/Queries",
//            "/home/ditss/Source/Repos/Skillswap/src/services/AppointmentService/Application/Queries",
//            "/home/ditss/Source/Repos/Skillswap/src/services/NotificationService/Application/Queries",
//            "/home/ditss/Source/Repos/Skillswap/src/services/VideocallService/Application/Queries"
//        };

//        // Act & Assert
//        foreach (var servicePath in serviceQueryPaths)
//        {
//            if (!Directory.Exists(servicePath)) continue;

//            var queryFiles = Directory.GetFiles(servicePath, "*Query.cs", SearchOption.AllDirectories);
//            queryFiles.Should().BeEmpty($"Service path {servicePath} should be empty after migration to shared");
//        }
//    }

//    [Fact]
//    public void ServiceQueryHandlers_Should_BeMovedToShared()
//    {
//        // Arrange
//        var serviceHandlerPaths = new[]
//        {
//            "/home/ditss/Source/Repos/Skillswap/src/services/UserService/Application/QueryHandlers",
//            "/home/ditss/Source/Repos/Skillswap/src/services/SkillService/Application/QueryHandlers",
//            "/home/ditss/Source/Repos/Skillswap/src/services/MatchmakingService/Application/QueryHandlers",
//            "/home/ditss/Source/Repos/Skillswap/src/services/AppointmentService/Application/QueryHandlers",
//            "/home/ditss/Source/Repos/Skillswap/src/services/NotificationService/Application/QueryHandlers",
//            "/home/ditss/Source/Repos/Skillswap/src/services/VideocallService/Application/QueryHandlers"
//        };

//        // Act & Assert
//        foreach (var servicePath in serviceHandlerPaths)
//        {
//            if (!Directory.Exists(servicePath)) continue;

//            var handlerFiles = Directory.GetFiles(servicePath, "*QueryHandler.cs", SearchOption.AllDirectories);
//            handlerFiles.Should().BeEmpty($"Service path {servicePath} should be empty after migration to shared");
//        }
//    }

//    [Fact]
//    public void AllQueries_Should_HaveCorrespondingHandlers()
//    {
//        // Arrange
//        var queriesPath = Path.Combine(_sharedPath, "Queries");
//        var handlersPath = Path.Combine(_sharedPath, "QueryHandlers");
        
//        if (!Directory.Exists(queriesPath) || !Directory.Exists(handlersPath)) return;

//        var queryFiles = Directory.GetFiles(queriesPath, "*Query.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var queryFile in queryFiles)
//        {
//            var queryName = Path.GetFileNameWithoutExtension(queryFile);
//            var expectedHandlerName = queryName + "Handler.cs";
            
//            var queryDir = Path.GetDirectoryName(queryFile)?.Replace(queriesPath, "").Trim(Path.DirectorySeparatorChar);
//            var expectedHandlerPath = Path.Combine(handlersPath, queryDir ?? "", expectedHandlerName);
            
//            File.Exists(expectedHandlerPath).Should().BeTrue(
//                $"Query {queryName} should have corresponding handler at {expectedHandlerPath}");
//        }
//    }

//    [Fact]
//    public void ResponseModels_Should_BeOrganizedInShared()
//    {
//        // Arrange
//        var expectedResponsePath = Path.Combine(_sharedPath, "Models", "Responses");

//        // Act & Assert
//        Directory.Exists(expectedResponsePath).Should().BeTrue(
//            "Response models should be organized in shared Models/Responses folder");
//    }
//}