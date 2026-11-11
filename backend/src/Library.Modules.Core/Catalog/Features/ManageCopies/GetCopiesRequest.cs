using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Catalog.Features.ManageCopies;

/// <summary>Retrieves all physical copies of a given book.</summary>
public record GetCopiesRequest(int BookId) : IRequest<ApiResponse<List<CopyDetail>>>;

public record CopyDetail(
    int Id,
    string Barcode,
    int? LocationId,
    string? LocationLabel,
    DateOnly AcquiredDate,
    string Condition,
    string Status
);

/// <summary>Updates the status of a specific book copy (e.g. Available → Maintenance).</summary>
public record UpdateCopyStatusRequest(
    int CopyId,
    CopyStatus NewStatus
) : IRequest<ApiResponse<bool>>;

/// <summary>Assigns or moves a specific book copy to a shelf location (or clears location when null).</summary>
public record UpdateCopyLocationRequest(
    int CopyId,
    int? LocationId
) : IRequest<ApiResponse<bool>>;
