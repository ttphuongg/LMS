namespace Library.Modules.Core.Catalog.Data;

public class Author
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Biography { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<BookAuthor> BookAuthors { get; set; } = [];
}
