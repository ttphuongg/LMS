using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Search.Data;

public class SearchDbContext(DbContextOptions<SearchDbContext> options) : DbContext(options)
{
    public const string Schema = "search";

    public DbSet<SearchHistory> SearchHistories => Set<SearchHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SearchDbContext).Assembly,
            t => t.Namespace?.StartsWith("Library.Modules.Core.Search") == true);
    }
}

