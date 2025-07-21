
// namespace Infrastructure.HealthChecks;

// public interface IComprehensiveHealthCheckService
// {
//     Task<GetHealthStatusResponse> GetDetailedHealthStatusAsync(
//         string serviceName,
//         bool includeDependencies = true,
//         bool includeMetrics = false,
//         CancellationToken cancellationToken = default);

//     Task<Dictionary<string, GetHealthStatusResponse>> GetAllServicesHealthAsync(
//         CancellationToken cancellationToken = default);

//     Task<bool> IsServiceHealthyAsync(string serviceName, CancellationToken cancellationToken = default);

//     Task RegisterHealthCheckAsync(string checkName, Func<CancellationToken, Task<HealthCheckResult>> check);

//     Task<HealthCheckResult> ExecuteHealthCheckAsync(string checkName, CancellationToken cancellationToken = default);
// }

// public record HealthCheckResult(
//     string Name,
//     HealthStatus Status,
//     TimeSpan ResponseTime,
//     string? ErrorMessage = null,
//     Dictionary<string, object>? Data = null
// );
