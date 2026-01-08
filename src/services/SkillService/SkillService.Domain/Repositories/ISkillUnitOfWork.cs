namespace SkillService.Domain.Repositories;

public interface ISkillUnitOfWork : IAsyncDisposable
{
    ISkillRepository Skills { get; }
    ISkillCategoryRepository SkillCategories { get; }
    ISkillEndorsementRepository SkillEndorsements { get; }
    ISkillMatchRepository SkillMatches { get; }
    ISkillResourceRepository SkillResources { get; }
    ISkillReviewRepository SkillReviews { get; }
    ISkillViewRepository SkillViews { get; }
    ISkillFavoriteRepository SkillFavorites { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
