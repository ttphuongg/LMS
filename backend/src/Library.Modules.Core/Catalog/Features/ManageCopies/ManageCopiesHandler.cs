using FluentValidation;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.ManageCopies;

/// <summary>Handles adding a new physical copy (BookCopy) to an existing book.</summary>
public sealed class ManageCopiesHandler : IRequestHandler<AddCopyRequest, ApiResponse<int>>
{
    private readonly CatalogDbContext _db;
    private readonly IValidator<AddCopyRequest> _validator;

    public ManageCopiesHandler(CatalogDbContext db, IValidator<AddCopyRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<int>> Handle(AddCopyRequest request, CancellationToken ct)
    {
        // ── Validate input ────────────────────────────────────────────────────
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<int>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        // ── Verify book exists ────────────────────────────────────────────────
        var bookExists = await _db.Books.AnyAsync(b => b.Id == request.BookId, ct);
        if (!bookExists)
            return ApiResponse<int>.Fail($"Sách với Id = {request.BookId} không tồn tại.");

        // ── Check barcode uniqueness ──────────────────────────────────────────
        var barcode = request.Barcode.Trim();
        if (await _db.BookCopies.AnyAsync(c => c.Barcode == barcode, ct))
            return ApiResponse<int>.Fail($"Mã vạch '{barcode}' đã tồn tại trong hệ thống.");

        // ── Verify location exists and capacity (if provided) ───────────────────
        if (request.LocationId.HasValue)
        {
            var location = await _db.Locations
                .Include(l => l.BookCopies)
                .FirstOrDefaultAsync(l => l.Id == request.LocationId.Value, ct);

            if (location is null || !location.IsActive)
                return ApiResponse<int>.Fail($"Vị trí với Id = {request.LocationId.Value} không tồn tại hoặc đã bị vô hiệu hóa.");

            if (location.MaxCapacity.HasValue && location.BookCopies.Count >= location.MaxCapacity.Value)
                return ApiResponse<int>.Fail($"Vị trí ({location.Aisle} - {location.Shelf} - Tầng {location.RowLevel}) đã đạt sức chứa tối đa ({location.MaxCapacity.Value} bản sao).");
        }

        // ── Create BookCopy entity ────────────────────────────────────────────
        var copy = new BookCopy
        {
            BookId = request.BookId,
            Barcode = barcode,
            LocationId = request.LocationId,
            AcquiredDate = request.AcquiredDate ?? DateOnly.FromDateTime(DateTime.Today),
            Condition = request.Condition,
            Status = CopyStatus.Available,
            CreatedAt = DateTime.UtcNow
        };

        _db.BookCopies.Add(copy);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(copy.Id);
    }
}

/// <summary>Handles retrieving all physical copies of a given book.</summary>
public sealed class GetCopiesHandler : IRequestHandler<GetCopiesRequest, ApiResponse<List<CopyDetail>>>
{
    private readonly CatalogDbContext _db;
    public GetCopiesHandler(CatalogDbContext db) => _db = db;

    public async Task<ApiResponse<List<CopyDetail>>> Handle(GetCopiesRequest request, CancellationToken ct)
    {
        // ── Verify book exists ────────────────────────────────────────────────
        if (!await _db.Books.AnyAsync(b => b.Id == request.BookId, ct))
            return ApiResponse<List<CopyDetail>>.Fail($"Sách với Id = {request.BookId} không tồn tại.");

        // ── Query copies with location ────────────────────────────────────────
        var copies = await _db.BookCopies
            .Where(c => c.BookId == request.BookId)
            .OrderBy(c => c.Barcode)
            .Select(c => new CopyDetail(
                c.Id,
                c.Barcode,
                c.LocationId,
                c.Location != null
                    ? c.Location.Aisle + " - " + c.Location.Shelf + " - Tầng " + c.Location.RowLevel
                    : null,
                c.AcquiredDate,
                c.Condition.ToString(),
                c.Status.ToString()
            ))
            .ToListAsync(ct);

        return ApiResponse<List<CopyDetail>>.Ok(copies);
    }
}

/// <summary>Handles updating the status of a specific book copy.</summary>
public sealed class UpdateCopyStatusHandler : IRequestHandler<UpdateCopyStatusRequest, ApiResponse<bool>>
{
    private readonly CatalogDbContext _db;
    private readonly ISender _sender;

    public UpdateCopyStatusHandler(CatalogDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateCopyStatusRequest request, CancellationToken ct)
    {
        // ── Find the copy ─────────────────────────────────────────────────────
        var copy = await _db.BookCopies.FindAsync([request.CopyId], ct);
        if (copy is null)
            return ApiResponse<bool>.Fail($"Bản sao với Id = {request.CopyId} không tồn tại.");

        // ── Validate enum value ───────────────────────────────────────────────
        if (!Enum.IsDefined(request.NewStatus))
            return ApiResponse<bool>.Fail("Trạng thái bản sao không hợp lệ.");

        // ── Guard transitions ────────────────────────────────────────────────
        if (copy.Status == CopyStatus.Borrowed && request.NewStatus != CopyStatus.Borrowed)
        {
            return ApiResponse<bool>.Fail("Bản sao này hiện đang cho mượn. Vui lòng ghi nhận trả sách hoặc báo sự cố thay vì đổi trực tiếp trạng thái.");
        }

        if (request.NewStatus == CopyStatus.Available)
        {
            var isCurrentlyBorrowing = await _sender.Send(new HasActiveLoanForCopyQuery(copy.Id), ct);
            if (isCurrentlyBorrowing)
                return ApiResponse<bool>.Fail("Không thể chuyển sang Available vì bản sao này đang nằm trong một phiếu mượn chưa hoàn tất.");
        }

        // ── Update status ─────────────────────────────────────────────────────
        copy.Status = request.NewStatus;
        copy.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true);
    }
}
