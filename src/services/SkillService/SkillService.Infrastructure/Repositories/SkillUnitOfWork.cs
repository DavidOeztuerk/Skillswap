using Microsoft.EntityFrameworkCore.Storage;
using SkillService.Domain.Repositories;

namespace SkillService.Infrastructure.Repositories;

public class SkillUnitOfWork(
    SkillDbContext dbContext) 
    : ISkillUnitOfWork
{
    private readonly SkillDbContext _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    private IDbContextTransaction? _transaction;

    private ISkillRepository? _skills;
    private ISkillCategoryRepository? _skillCategories;
    private ISkillTopicRepository? _skillTopics;
    private ISkillEndorsementRepository? _skillEndorsements;
    private ISkillMatchRepository? _skillMatches;
    private ISkillResourceRepository? _skillResources;
    private ISkillReviewRepository? _skillReviews;
    private ISkillViewRepository? _skillViews;
    private ISkillFavoriteRepository? _skillFavorites;
    private IListingRepository? _listings;

    public ISkillRepository Skills =>
        _skills ??= new SkillRepository(_dbContext);

    public ISkillCategoryRepository SkillCategories =>
        _skillCategories ??= new SkillCategoryRepository(_dbContext);

    public ISkillTopicRepository SkillTopics =>
        _skillTopics ??= new SkillTopicRepository(_dbContext);

    public ISkillEndorsementRepository SkillEndorsements =>
        _skillEndorsements ??= new SkillEndorsementRepository(_dbContext);

    public ISkillMatchRepository SkillMatches =>
        _skillMatches ??= new SkillMatchRepository(_dbContext);

    public ISkillResourceRepository SkillResources =>
        _skillResources ??= new SkillResourceRepository(_dbContext);

    public ISkillReviewRepository SkillReviews =>
        _skillReviews ??= new SkillReviewRepository(_dbContext);

    public ISkillViewRepository SkillViews =>
        _skillViews ??= new SkillViewRepository(_dbContext);

    public ISkillFavoriteRepository SkillFavorites =>
        _skillFavorites ??= new SkillFavoriteRepository(_dbContext);

    /// <summary>
    /// Phase 10: Listing repository for skill listings
    /// </summary>
    public IListingRepository Listings =>
        _listings ??= new ListingRepository(_dbContext);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            if (_transaction != null)
            {
                await _transaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }
        finally
        {
            if (_transaction != null)
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync(cancellationToken);
            }
        }
        finally
        {
            if (_transaction != null)
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_transaction != null)
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }

        await _dbContext.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
