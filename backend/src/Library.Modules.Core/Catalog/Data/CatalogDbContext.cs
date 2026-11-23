using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Data;

public class CatalogDbContext(DbContextOptions<CatalogDbContext> options) : DbContext(options)
{
    public const string Schema = "catalog";

    public DbSet<Book> Books => Set<Book>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<BookAuthor> BookAuthors => Set<BookAuthor>();
    public DbSet<BookCategory> BookCategories => Set<BookCategory>();
    public DbSet<BookCopy> BookCopies => Set<BookCopy>();
    public DbSet<Location> Locations => Set<Location>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        // Bỏ qua SearchVector (kiểu NpgsqlTsVector của PostgreSQL) nếu chạy trong môi trường kiểm thử InMemory
        if (Database.ProviderName != "Npgsql.EntityFrameworkCore.PostgreSQL")
        {
            modelBuilder.Entity<Book>().Ignore(b => b.SearchVector);
        }

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CatalogDbContext).Assembly,
            t => t.Namespace?.StartsWith("Library.Modules.Core.Catalog") == true);
    }
}

