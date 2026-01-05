using AppointmentService.Domain.Entities;

namespace AppointmentService.Domain.Repositories;

/// <summary>
/// Repository interface for SessionRating entities.
/// Manages session rating operations.
/// </summary>
public interface ISessionRatingRepository
{
    // Query operations
    Task<SessionRating?> GetByIdAsync(string ratingId, CancellationToken cancellationToken = default);
    Task<SessionRating?> GetByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<List<SessionRating>> GetByRaterAsync(string raterId, CancellationToken cancellationToken = default);
    Task<List<SessionRating>> GetByRateeAsync(string rateeId, CancellationToken cancellationToken = default);
    Task<SessionRating?> GetBySessionAndRaterAsync(string appointmentId, string raterId, CancellationToken cancellationToken = default);

    // Paginated query for user reviews (reviews received by user)
    Task<List<SessionRating>> GetUserReviewsWithPaginationAsync(
        string userId,
        int pageNumber,
        int pageSize,
        int? starFilter = null,
        CancellationToken cancellationToken = default);

    Task<int> GetUserReviewsCountAsync(
        string userId,
        int? starFilter = null,
        CancellationToken cancellationToken = default);

    // Statistics for histogram display
    Task<Dictionary<int, int>> GetRatingDistributionAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<(double? avgKnowledge, double? avgTeaching, double? avgCommunication, double? avgReliability)>
        GetSectionAveragesAsync(string userId, CancellationToken cancellationToken = default);

    // Create operations
    Task<SessionRating> CreateAsync(SessionRating rating, CancellationToken cancellationToken = default);

    // Update operations
    Task<SessionRating> UpdateAsync(SessionRating rating, CancellationToken cancellationToken = default);

    // Delete operations
    Task DeleteAsync(string ratingId, CancellationToken cancellationToken = default);
    Task DeleteByAppointmentAsync(string appointmentId, CancellationToken cancellationToken = default);

    // Save changes
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
