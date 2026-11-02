namespace Library.Modules.Core.Search.Data;

/// <summary>
/// Records a reader's search query for analytics and recommendations (LichSuTimKiem).
/// Cross-context FK to Identity.Account stored as primitive Id.
/// </summary>
public class SearchHistory
{
    public long Id { get; set; }

    // Cross-context FK → Identity.Account
    public int AccountId { get; set; }

    public string Keyword { get; set; } = default!;
    public string SearchType { get; set; } = "BOOK";
    public int? ResultCount { get; set; }
    public DateTime SearchedAt { get; set; } = DateTime.UtcNow;
}
