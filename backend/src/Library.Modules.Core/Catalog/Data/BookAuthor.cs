namespace Library.Modules.Core.Catalog.Data;

/// <summary>Join table: Sach ↔ TacGia (many-to-many)</summary>
public class BookAuthor
{
    public int BookId { get; set; }
    public Book Book { get; set; } = default!;

    public int AuthorId { get; set; }
    public Author Author { get; set; } = default!;
}
