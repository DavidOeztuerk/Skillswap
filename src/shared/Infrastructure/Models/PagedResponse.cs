namespace Infrastructure.Models;

/// <summary>
/// Paginated response for list endpoints
/// </summary>
/// <typeparam name="T">Type of the items in the list</typeparam>
public class PagedResponse<T> : ApiResponse<List<T>>
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public int TotalRecords { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }

    public static PagedResponse<T> Create(
        List<T> data,
        int pageNumber,
        int pageSize,
        int totalRecords,
        string? message = null)
    {
        var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

        return new PagedResponse<T>
        {
            Success = true,
            Data = data,
            Message = message,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = totalPages,
            TotalRecords = totalRecords,
            HasNextPage = pageNumber < totalPages,
            HasPreviousPage = pageNumber > 1
        };
    }
}
