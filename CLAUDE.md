# CLAUDE.md - Skillswap Development Guide

## 🎯 Project Context
- **Status**: MVP in active development
- **Architecture**: Microservices with Event-Driven Architecture, CQRS, and Event Sourcing
- **Priority**: Full-stack development with focus on authentication, RBAC, and core features
- **Development Environment**: Visual Studio & VS Code

## 🚨 Critical Rules - ALWAYS FOLLOW

### 🎯 KISS Principle (Keep It Simple, Stupid)
- **ALWAYS start with the SIMPLEST solution first**
- **QUESTION complexity**: Ask "Is this really necessary?" before building abstractions
- **AVOID over-engineering**: Don't build features "for the future" - build what's needed NOW
- **PREFER explicit over clever**: Simple, readable code > clever abstractions
- **DELETE unused code**: If it's not used, remove it immediately

### 🔍 Analysis Before Implementation
- **UNDERSTAND the flow FIRST**:
  - Frontend: Which hook? Which slice? Which API call?
  - Backend: Which route? Which handler? Which service?
- **READ existing code** before writing new code
- **CHECK for existing solutions** before creating new ones
- **VERIFY the actual problem** before proposing solutions
- **TEST your understanding** by explaining the flow back

### Security & Authentication
- **NEVER modify authentication without explicit confirmation**
- **ALWAYS implement RBAC checks for admin and protected areas**
- **ALWAYS validate in backend, display in frontend**
- **IMPLEMENT 2FA authentication support in frontend**
- **HANDLE unauthenticated users**: Check if tokens exist before attempting refresh
- **PUBLIC endpoints**: Always configure PermissionMiddleware for public routes

### Code Generation
- **ALWAYS generate complete files, not snippets**
- **ALWAYS use async/await where possible**
- **ALWAYS include error handling and logging**
- **ALWAYS add FluentValidation for all commands** (field validation ONLY)
- **ALWAYS use contracts from shared/Contracts (create if missing)**

### Architecture Patterns
- **ALWAYS use CQRS pattern with MediatR**
- **ALWAYS return ApiResponse or PagedResponse from APIs**
- **ALWAYS use ServiceCommunicationManager for inter-service calls**
- **ALWAYS communicate through Gateway (port 8080)**
- **NEVER expose entities directly to frontend**
- **ALWAYS use DTOs/Contracts for API communication**
- **NEVER bypass Gateway for service-to-service communication**

## 📁 Project Structure & Standards

### Naming Conventions
```csharp
// C# - PascalCase
public class UserService { }
public interface IUserRepository { }
public record CreateUserCommand { }
```

```typescript
// TypeScript - camelCase
const userService = new UserService();
function handleUserCreation() { }
interface UserProfile { }
```

### Clean Architecture Implementation
```
UserService (Clean Architecture fully implemented)
├── Domain/           # Entities, ValueObjects, Events
├── Application/      # Commands, Queries, Handlers, Validators
├── Infrastructure/   # Data, External Services
└── API/             # Controllers, Endpoints

Other Services (transitioning to Clean Architecture)
├── Application/      # Commands, Queries, Handlers
├── Domain/          # Entities, Events
├── Infrastructure/  # DbContext, Repositories
└── Consumers/       # Event Consumers
```

## 🔧 Development Workflow

### 1. Feature Development Checklist
```markdown
□ Create/Update Domain Entity
□ Create Command/Query in Application layer
□ Add FluentValidation validator
□ Create/Update Contract in shared/Contracts
□ Implement Handler with proper error handling
□ Add logging at key points
□ Update DbContext and migrations
□ Configure cascade delete rules
□ Publish domain events if needed
□ Create event consumers if needed
□ Update Gateway routing if new endpoint
□ Implement frontend service
□ Create/Update Redux slice
□ Build UI with MUI components
□ Add RBAC checks in frontend
□ Handle null/undefined checks
□ Test complete flow
```

### 2. Database Modeling Guidelines
```csharp
// Fluent API Configuration Example
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // Primary Key
        builder.HasKey(u => u.Id);
        
        // Indexes
        builder.HasIndex(u => u.Email).IsUnique();
        
        // Relationships with Cascade Delete
        builder.HasMany(u => u.Skills)
            .WithOne(s => s.User)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade); // Cascade delete
            
        // Value Objects
        builder.OwnsOne(u => u.Address);
        
        // Concurrency Token
        builder.Property(u => u.RowVersion)
            .IsRowVersion();
    }
}
```

### 3. CQRS Implementation Pattern

#### ✅ Validation Strategy
**CRITICAL**: Keep validation simple and focused!

- **FluentValidation**: ONLY for field/input validation (required, length, format, etc.)
- **Business Logic**: Handle in Command/Query Handlers, NOT in validators
- **Cross-Service Validation**: Handle in handlers with ServiceCommunicationManager
- **NO over-engineering**: Don't create complex validation services/abstractions

```csharp
// Command with Validation (FIELD VALIDATION ONLY)
public record CreateSkillCommand(string Name, string CategoryId) : IRequest<ApiResponse<SkillResponse>>;

public class CreateSkillCommandValidator : AbstractValidator<CreateSkillCommand>
{
    public CreateSkillCommandValidator()
    {
        // ONLY field validation - simple rules
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Skill name is required")
            .Length(3, 100).WithMessage("Skill name must be between 3 and 100 characters");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required");
    }
}

// Handler with Business Logic Validation
public class CreateSkillCommandHandler : IRequestHandler<CreateSkillCommand, ApiResponse<SkillResponse>>
{
    private readonly ISkillRepository _repository;
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly IEventBus _eventBus;
    private readonly ILogger<CreateSkillCommandHandler> _logger;
    private readonly ICacheService _cache;

    public async Task<ApiResponse<SkillResponse>> Handle(CreateSkillCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Creating skill: {SkillName}", request.Name);

            // Business logic validation: Check if category exists
            var categoryExists = await _serviceCommunication.GetAsync<bool>(
                "SkillService",
                $"/api/categories/{request.CategoryId}/exists"
            );

            if (!categoryExists)
                return ApiResponse<SkillResponse>.Failure("Category does not exist");

            // Business logic: Create entity
            var skill = Skill.Create(request.Name, request.CategoryId);

            // Repository pattern
            await _repository.AddAsync(skill, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            // Invalidate cache
            await _cache.RemoveAsync($"skills:*", cancellationToken);

            // Publish event
            await _eventBus.PublishAsync(new SkillCreatedEvent(skill.Id, skill.Name), cancellationToken);

            // Map to response
            var response = skill.ToResponse();

            return ApiResponse<SkillResponse>.Success(response, "Skill created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating skill");
            return ApiResponse<SkillResponse>.Failure("Failed to create skill");
        }
    }
}
```

### 4. Service Communication Pattern

#### ✅ Use ServiceCommunicationManager (ALWAYS)
**CRITICAL**: ALL inter-service HTTP calls MUST use ServiceCommunicationManager!

```csharp
// ✅ CORRECT: Using ServiceCommunicationManager
public class UserServiceClient
{
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<UserServiceClient> _logger;

    public UserServiceClient(IServiceCommunicationManager serviceCommunication, ILogger<UserServiceClient> logger)
    {
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task<UserProfileResponse?> GetUserProfileAsync(string userId)
    {
        try
        {
            // ServiceCommunicationManager automatically:
            // - Routes through Gateway
            // - Handles circuit breaker & retry
            // - Unwraps ApiResponse<T> to T
            // - Adds M2M authentication
            var profile = await _serviceCommunication.GetAsync<UserProfileResponse>(
                "UserService",
                $"/api/users/{userId}/profile"
            );

            return profile;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user profile for {UserId}", userId);
            return null;
        }
    }
}

// ❌ WRONG: Direct HttpClient usage
// Never do this! No circuit breaker, no retry, no M2M auth
public class BadUserServiceClient
{
    private readonly HttpClient _httpClient;

    public async Task<UserProfileResponse?> GetUserProfileAsync(string userId)
    {
        var response = await _httpClient.GetAsync($"http://localhost:8080/api/users/{userId}/profile");
        // Missing error handling, retry, circuit breaker, M2M auth...
    }
}
```

#### ✅ Configuration in appsettings.json
```json
{
  "ServiceCommunication": {
    "GatewayBaseUrl": "http://localhost:8080",
    "DefaultTimeout": "00:00:30",
    "EnableResponseCaching": true,
    "EnableMetrics": true,
    "EnableRequestDeduplication": true,
    "M2M": {
      "Enabled": true,
      "TokenEndpoint": "http://localhost:8080/api/auth/service-token",
      "ServiceId": "AppointmentService",
      "ServiceSecret": "your-service-secret"
    },
    "CircuitBreaker": {
      "ExceptionsAllowedBeforeBreaking": 5,
      "DurationOfBreak": "00:00:30",
      "Timeout": "00:00:15",
      "FailureThreshold": 0.5,
      "MinimumThroughput": 10
    },
    "RetryPolicy": {
      "MaxRetries": 3,
      "InitialDelay": "00:00:01",
      "MaxDelay": "00:00:10",
      "BackoffStrategy": "ExponentialBackoffWithJitter",
      "RetryOnTimeout": true,
      "RetryableStatusCodes": [408, 429, 500, 502, 503, 504],
      "RetryableExceptions": ["HttpRequestException", "TimeoutException"]
    }
  }
}
```

### 5. Event-Driven Communication
```csharp
// Event Definition
public record SkillCreatedEvent(Guid SkillId, string SkillName) : IEvent;

// Consumer Implementation
public class SkillCreatedConsumer : IConsumer<SkillCreatedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<SkillCreatedConsumer> _logger;

    public async Task Consume(ConsumeContext<SkillCreatedEvent> context)
    {
        _logger.LogInformation("Processing SkillCreatedEvent for skill: {SkillId}", context.Message.SkillId);

        // Send notification
        await _notificationService.SendSkillCreatedNotification(context.Message);
    }
}
```

### 6. Frontend Service Pattern

#### ✅ API Service with apiClient
```typescript
// API Service - Use apiClient methods
export const skillService = {
  // Always pass params directly, NOT wrapped in { params }
  async getAllSkills(params?: SkillSearchParams): Promise<PagedResponse<SkillSearchResultResponse>> {
    return await apiClient.getPaged<SkillSearchResultResponse>(
      SKILL_ENDPOINTS.GET_SKILLS,
      params  // ✅ CORRECT: Direct params
      // ❌ WRONG: { params } - causes params[pageNumber] nesting
    ) as PagedResponse<SkillSearchResultResponse>;
  },

  async getSkillById(skillId: string): Promise<ApiResponse<SkillDetailsResponse>> {
    return await apiClient.get<SkillDetailsResponse>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}`
    );
  }
};
```

#### ✅ apiClient Authentication Handling
```typescript
// ✅ CORRECT: Only refresh tokens if user has tokens
if (status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
  const isAuthEndpoint = originalRequest.url?.includes('/login') ||
                        originalRequest.url?.includes('/register');

  // Check if tokens exist before attempting refresh
  const hasTokens = getToken() && getRefreshToken();

  if (!isAuthEndpoint && hasTokens) {
    return this.handleTokenRefresh(originalRequest);
  }

  // If no tokens exist, this is an unauthenticated request
  // Don't redirect - let the component handle it
  if (!hasTokens) {
    console.debug('401 on unauthenticated request - not attempting token refresh');
  }
}
```

#### ✅ PermissionMiddleware for Public Endpoints
```csharp
// Backend: Configure public endpoints in PermissionMiddleware
private bool IsPublicEndpoint(PathString path)
{
    var publicPaths = new[]
    {
        "/health",
        "/api/auth",
        "/api/users/login",
        "/api/users/register",
        "/api/skills",              // ✅ Public skill browsing
        "/api/categories",           // ✅ Public categories
        "/api/proficiency-levels"    // ✅ Public proficiency levels
    };

    return publicPaths.Any(p => path.StartsWithSegments(p, StringComparison.OrdinalIgnoreCase));
}
```

#### ✅ Redux Slice Pattern
```typescript
const skillSlice = createSlice({
    name: 'skills',
    initialState,
    reducers: {
        // Only modify state here
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSkills.fulfilled, (state, action) => {
                // Always check for null/undefined
                if (action.payload?.data) {
                    state.skills = action.payload.data;
                }
            });
    }
});
```

## 🚀 Performance & Optimization

### Caching Strategy
```csharp
// Redis caching with fallback
public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null)
{
    try
    {
        // Try Redis first
        var cached = await _redisCache.GetAsync<T>(key);
        if (cached != null) return cached;
        
        // Get from source
        var data = await factory();
        
        // Cache with expiry
        await _redisCache.SetAsync(key, data, expiry ?? TimeSpan.FromMinutes(15));
        
        return data;
    }
    catch (RedisException ex)
    {
        _logger.LogWarning(ex, "Redis unavailable, using memory cache");
        // Fallback to memory cache
        return await _memoryCache.GetOrCreateAsync(key, async entry =>
        {
            entry.SlidingExpiration = expiry ?? TimeSpan.FromMinutes(5);
            return await factory();
        });
    }
}
```

### Repository Pattern with Specification
```csharp
public interface IRepository<T> where T : Entity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<T?> GetBySpecAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);
    Task<List<T>> ListAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);
    Task<PagedList<T>> PagedListAsync(ISpecification<T> spec, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

## 🐛 Common Issues & Solutions

### Frontend Issues
```typescript
// Problem: Multiple re-renders
// Solution: Use proper dependencies and memoization
const MemoizedComponent = React.memo(({ data }) => {
    const processedData = useMemo(() => 
        data?.filter(item => item?.isActive) ?? [], 
    [data]);
    
    return <div>{/* render */}</div>;
});

// Problem: Request/Response mismatch
// Solution: Always use typed contracts
interface SkillResponse {
    id: string;
    name: string;
    category: string;
    // Match exactly with backend DTO
}

// Problem: Null/undefined errors
// Solution: Defensive programming
const safeName = user?.profile?.name ?? 'Unknown';
const skills = response?.data?.skills || [];
```

### Backend Issues
```csharp
// Problem: N+1 queries
// Solution: Use Include for eager loading
var users = await _context.Users
    .Include(u => u.Skills)
    .ThenInclude(s => s.Category)
    .AsSplitQuery() // For multiple includes
    .ToListAsync();

// Problem: Concurrent updates
// Solution: Use optimistic concurrency
public class User
{
    [Timestamp]
    public byte[] RowVersion { get; set; }
}
```

## 📊 Monitoring & Health

### Health Checks
```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database")
    .AddRedis("redis")
    .AddRabbitMQ("rabbitmq")
    .AddCheck<CustomHealthCheck>("custom");
```

### Structured Logging
```csharp
// Use structured logging for better monitoring
_logger.LogInformation("User {UserId} created skill {SkillId} in category {Category}", 
    userId, skillId, category);

// Critical operations
using (_logger.BeginScope(new Dictionary<string, object>
{
    ["UserId"] = userId,
    ["Operation"] = "CreateSkill"
}))
{
    // Operation code
}
```

## 🔄 Git Workflow

### Commit Message Format
```bash
# Feature
git commit -m "feat(skills): add skill matching algorithm"

# Fix
git commit -m "fix(auth): resolve JWT token expiration issue"

# Refactor
git commit -m "refactor(user-service): implement clean architecture"

# Test
git commit -m "test(matching): add unit tests for matching service"

# Docs
git commit -m "docs: update CLAUDE.md with CQRS examples"
```

### Branch Strategy
```bash
main              # Production-ready code
├── develop       # Integration branch
    ├── feature/  # New features
    ├── fix/      # Bug fixes
    └── refactor/ # Code improvements
```

## 🎭 RBAC Implementation

### Backend Authorization
```csharp
[Authorize(Roles = "Admin")]
[Authorize(Policy = "CanManageSkills")]
public async Task<IActionResult> DeleteSkill(Guid id) { }

// Custom requirement
public class SkillOwnerRequirement : IAuthorizationRequirement { }

public class SkillOwnerHandler : AuthorizationHandler<SkillOwnerRequirement, Skill>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        SkillOwnerRequirement requirement,
        Skill resource)
    {
        if (context.User.GetUserId() == resource.UserId)
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
```

### Frontend RBAC
```typescript
// Role-based component
const AdminPanel = withRBAC(['Admin'])(({ children }) => {
    return <div>{children}</div>;
});

// Permission-based rendering
{hasPermission('manage_skills') && (
    <Button onClick={handleDelete}>Delete Skill</Button>
)}
```

## 📝 Testing Strategy (Future Implementation)

### Unit Test Structure
```csharp
[Fact]
public async Task CreateSkill_WithValidData_ReturnsSuccess()
{
    // Arrange
    var command = new CreateSkillCommand("C#", "Programming");
    
    // Act
    var result = await _handler.Handle(command, CancellationToken.None);
    
    // Assert
    Assert.True(result.IsSuccess);
    Assert.NotNull(result.Data);
    Assert.Equal("C#", result.Data.Name);
}
```

## 🚢 Future: CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup .NET
        uses: actions/setup-dotnet@v1
        with:
          dotnet-version: '9.0.x'
      - name: Test
        run: dotnet test
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker images
        run: docker-compose build
```

## 🎯 Development Priorities

1. **Immediate** (Current Sprint)
   - Complete RBAC implementation
   - Fix authentication/authorization issues
   - Stabilize core features (Skills, Matching, Appointments)
   - Fix frontend request/response compatibility
   - Add null/undefined checks throughout

2. **Short-term** (Next 2-3 Sprints)
   - Migrate all services to Clean Architecture
   - Implement comprehensive testing
   - Optimize Redis caching
   - Complete Event Sourcing implementation
   - Separate PostgreSQL instances per service

3. **Medium-term**
   - Set up CI/CD pipeline
   - Kubernetes deployment configuration
   - Terraform infrastructure as code
   - Complete admin panel
   - Performance optimization

## 💡 Quick Commands Reference

```bash
# Development
npm run dev                                    # Start frontend
dotnet run --project src/services/Gateway     # Start gateway
docker-compose up --build                      # Start all services

# Database
dotnet ef migrations add InitialCreate --project src/services/UserService
dotnet ef database update --project src/services/UserService

# Testing (when implemented)
dotnet test --filter Category=Unit
dotnet test --filter Category=Integration

# Docker
docker-compose logs -f gateway
docker-compose restart userservice

# npm suggestions
npm install                  # After pulling changes
npm audit fix               # Fix vulnerabilities
npm run build              # Production build
```

## ⚠️ Do's and Don'ts

### ✅ DO's
- **ALWAYS start simple** - KISS principle over clever abstractions
- **ALWAYS analyze before coding** - Understand the flow first
- **ALWAYS use ServiceCommunicationManager** for inter-service calls
- **ALWAYS validate in backend**, display errors in frontend
- **ALWAYS use FluentValidation** for field validation ONLY
- **ALWAYS handle unauthenticated users** properly in frontend
- **ALWAYS configure public endpoints** in PermissionMiddleware
- **ALWAYS check for null/undefined** in TypeScript
- Use dependency injection everywhere
- Use pagination for list endpoints
- Log important business operations
- Use transactions for multi-step operations
- Delete unused code immediately

### ❌ DON'Ts
- **NEVER over-engineer** - Don't build abstractions "for the future"
- **NEVER bypass the Gateway** for service communication
- **NEVER use direct HttpClient** - Always use ServiceCommunicationManager
- **NEVER create complex validation services** - Use FluentValidation + Handler logic
- **NEVER attempt token refresh without checking if tokens exist**
- **NEVER wrap params in objects** when passing to apiClient (use `params` not `{ params }`)
- Don't expose internal exceptions to users
- Don't use Entity classes as DTOs
- Don't store sensitive data in frontend state
- Don't ignore FluentValidation rules
- Don't use synchronous I/O operations
- Don't create tight coupling between services
- Don't forget cascade delete configuration

### 🚫 Anti-Patterns (LESSONS LEARNED)

#### ❌ Over-Engineering Validation
```csharp
// ❌ WRONG: Complex cross-service validation abstraction
public interface ICrossServiceValidationService
{
    Task<ValidationResult> ValidateUserExists(string userId);
    Task<ValidationResult> ValidateSkillExists(string skillId);
    // 1000+ lines of mock code...
}

// ✅ CORRECT: Simple validation in handler
public async Task<ApiResponse<T>> Handle(Command request)
{
    var userExists = await _serviceCommunication.GetAsync<bool>(
        "UserService",
        $"/api/users/{request.UserId}/exists"
    );

    if (!userExists)
        return ApiResponse<T>.Failure("User not found");
}
```

#### ❌ Direct HttpClient Usage
```csharp
// ❌ WRONG: No retry, circuit breaker, M2M auth
private readonly HttpClient _httpClient;
var response = await _httpClient.GetAsync("http://localhost:8080/api/users/123");

// ✅ CORRECT: Use ServiceCommunicationManager
private readonly IServiceCommunicationManager _serviceCommunication;
var user = await _serviceCommunication.GetAsync<UserResponse>("UserService", "/api/users/123");
```

#### ❌ Frontend Token Refresh Without Check
```typescript
// ❌ WRONG: Always tries to refresh, even for unauthenticated users
if (status === 401) {
  return this.handleTokenRefresh(originalRequest);  // Creates redirect loop!
}

// ✅ CORRECT: Check if tokens exist first
if (status === 401 && !originalRequest._retry) {
  const hasTokens = getToken() && getRefreshToken();
  if (hasTokens) {
    return this.handleTokenRefresh(originalRequest);
  }
}
```

## 🔍 Debugging Guide

### Logging Priorities
1. **Critical**: Authentication failures, payment issues, data corruption
2. **Error**: Unhandled exceptions, external service failures
3. **Warning**: Performance issues, fallback to alternatives
4. **Information**: User actions, business operations
5. **Debug**: Detailed flow, variable states (dev only)

### Common Debug Commands
```bash
# View service logs
docker-compose logs -f [service-name] | grep ERROR

# Check health
curl http://localhost:8080/health

# RabbitMQ Management
http://localhost:15672 (guest/guest)

# Redis CLI
docker exec -it redis redis-cli
```

---
**Remember**: This is an MVP. Focus on functionality first, optimize later. Always keep the code maintainable and follow the patterns established here.