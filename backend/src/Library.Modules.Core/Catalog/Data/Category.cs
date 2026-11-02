namespace Library.Modules.Core.Catalog.Data;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    public ICollection<BookCategory> BookCategories { get; set; } = [];
}
