using Library.Modules.Core.Catalog.Data;
using MediatR;

namespace Library.Modules.Core.Catalog.Contracts;

public record BookInfo(int BookId, string Title, bool IsActive);
public record GetBookInfosQuery(IReadOnlyCollection<int> BookIds) : IRequest<IReadOnlyDictionary<int, BookInfo>>;
public record CopyInfo(
    int CopyId,
    string Barcode,
    int BookId,
    string BookTitle,
    bool IsBookActive,
    CopyCondition Condition,
    CopyStatus Status,
    string? LocationLabel = null);
public record GetCopyInfosQuery(IReadOnlyCollection<int> CopyIds) : IRequest<IReadOnlyDictionary<int, CopyInfo>>;
public record SearchCopyIdsByBarcodeQuery(string Keyword) : IRequest<List<int>>;
public record FindAvailableCopyQuery(int BookId, int? PreferredCopyId = null) : IRequest<CopyInfo?>;
public record SetCopyStatusCommand(int CopyId, CopyStatus? ExpectedStatus, CopyStatus NewStatus, CopyCondition? NewCondition = null) : IRequest<bool>;
public record GetActiveBookCopiesCountQuery() : IRequest<int>;
public record GetActiveBookTitlesCountQuery() : IRequest<int>;

