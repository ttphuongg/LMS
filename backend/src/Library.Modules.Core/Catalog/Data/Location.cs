namespace Library.Modules.Core.Catalog.Data;

public class Location
{
    public int Id { get; set; }

    /// <summary>Dãy kệ, ví dụ: "A", "B", "C".</summary>
    public string Aisle { get; set; } = default!;

    /// <summary>Kệ trong dãy, ví dụ: "01", "02".</summary>
    public string Shelf { get; set; } = default!;

    /// <summary>Tầng/hàng trên kệ (1 = thấp nhất), ví dụ: 1, 2, 3.</summary>
    public int RowLevel { get; set; }

    /// <summary>Sức chứa tối đa của vị trí này (null = không giới hạn).</summary>
    public int? MaxCapacity { get; set; }

    /// <summary>Vị trí có đang hoạt động không. Dùng để soft-disable thay vì xóa.</summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }

    // Navigation
    public ICollection<BookCopy> BookCopies { get; set; } = [];
}

