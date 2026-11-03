namespace Library.Modules.Core.Catalog.Data;

/// <summary>Join table: Sach ↔ TheLoai (many-to-many)</summary>
public class BookCategory
{
    public int BookId { get; set; }
    public Book Book { get; set; } = default!;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = default!;
}
