using Library.Modules.Core.Catalog.Contracts;

namespace Library.Modules.Core.Catalog.Data;

public class Book
{
    public int Id { get; set; }
    public string? Isbn { get; set; }
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public short? PublishedYear { get; set; }
    public string? Publisher { get; set; }
    public string? Language { get; set; }
    public int? PageCount { get; set; }
    public decimal? BookValue { get; set; }
    public string? CoverImageUrl { get; set; }

    public BookStatus Status { get; set; } = BookStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }
    public byte[] RowVersion { get; set; } = default!;

    // Navigation (within Catalog context)
    public ICollection<BookAuthor> BookAuthors { get; set; } = [];
    public ICollection<BookCategory> BookCategories { get; set; } = [];
    public ICollection<BookCopy> Copies { get; set; } = [];
}
