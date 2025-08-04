namespace CQRS.Models;

/// <summary>
/// Standard API response wrapper for all endpoints
/// </summary>
/// <typeparam name="T">Type of the data being returned</typeparam>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? TraceId { get; set; } = Guid.NewGuid().ToString();

    public static ApiResponse<T> SuccessResult(T? data, string? message = null)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message
        };
    }

    public static ApiResponse<T> ErrorResult(string error, string? traceId = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Errors = [error],
            TraceId = traceId
        };
    }

    public static ApiResponse<T> ErrorResult(List<string> errors, string? traceId = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Errors = errors,
            TraceId = traceId
        };
    }
}
