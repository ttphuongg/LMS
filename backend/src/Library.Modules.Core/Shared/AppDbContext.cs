using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Search.Data;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Shared;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ── Identity ──────────────────────────────────────────────────────────────
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<LoginSession> LoginSessions => Set<LoginSession>();

    // ── Catalog ───────────────────────────────────────────────────────────────
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<BookAuthor> BookAuthors => Set<BookAuthor>();
    public DbSet<BookCategory> BookCategories => Set<BookCategory>();
    public DbSet<BookCopy> BookCopies => Set<BookCopy>();
    public DbSet<Location> Locations => Set<Location>();

    // ── Circulation ───────────────────────────────────────────────────────────
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<LoanSlip> LoanSlips => Set<LoanSlip>();
    public DbSet<LoanSlipDetail> LoanSlipDetails => Set<LoanSlipDetail>();
    public DbSet<Renewal> Renewals => Set<Renewal>();
    public DbSet<Incident> Incidents => Set<Incident>();

    // ── Billing ───────────────────────────────────────────────────────────────
    public DbSet<Fine> Fines => Set<Fine>();
    public DbSet<FinePayment> FinePayments => Set<FinePayment>();

    // ── Notifications ─────────────────────────────────────────────────────────
    public DbSet<Notification> Notifications => Set<Notification>();

    // ── Search ────────────────────────────────────────────────────────────────
    public DbSet<SearchHistory> SearchHistories => Set<SearchHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Cross-module foreign keys configured centrally in AppDbContext to preserve module boundaries
        modelBuilder.Entity<Incident>()
            .HasOne<Account>()
            .WithMany()
            .HasForeignKey(i => i.LibrarianId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        modelBuilder.Entity<LoanSlip>()
            .HasOne<Account>()
            .WithMany()
            .HasForeignKey(ls => ls.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LoanSlip>()
            .HasOne<Account>()
            .WithMany()
            .HasForeignKey(ls => ls.LibrarianId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        modelBuilder.Entity<LoanSlipDetail>()
            .HasOne<BookCopy>()
            .WithMany()
            .HasForeignKey(d => d.BookCopyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Renewal>()
            .HasOne<Account>()
            .WithMany()
            .HasForeignKey(r => r.LibrarianId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        modelBuilder.Entity<Reservation>()
            .HasOne<Account>()
            .WithMany()
            .HasForeignKey(r => r.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Reservation>()
            .HasOne<Book>()
            .WithMany()
            .HasForeignKey(r => r.BookId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Reservation>()
            .HasOne<BookCopy>()
            .WithMany()
            .HasForeignKey(r => r.BookCopyId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);
    }
}
