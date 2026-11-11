using FluentValidation;
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

        // ── Verify location exists, is active & has capacity (if provided) ────
        if (request.LocationId.HasValue)
        {
            var locationError = await CopyLocationValidationHelper.ValidateAsync(
                _db, request.LocationId.Value, excludingCopyId: null, ct);
            if (locationError is not null)
                return ApiResponse<int>.Fail(locationError);
        }

        // ── Create BookCopy entity ────────────────────────────────────────────
        var copy = new BookCopy
        {
            BookId = request.BookId,
            Barcode = barcode,
            LocationId = request.LocationId,
            AcquiredDate = request.AcquiredDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7)),
            Condition = request.Condition,
            Status = CopyStatus.Available
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

        // ── Guard active loan or active reservation before changing copy status ─
        if (request.NewStatus != copy.Status)
        {
            if (copy.Status == CopyStatus.Reserved)
                return ApiResponse<bool>.Fail("Bản sao đang được giữ cho yêu cầu đặt trước, vui lòng xử lý tại quầy đặt trước.");

            if (await _sender.Send(new HasActiveLoanForCopyQuery(copy.Id), ct))
                return ApiResponse<bool>.Fail("Không thể đổi trạng thái thủ công khi bản sao đang trong phiếu mượn hoạt động.");
        }

        // ── Update status ─────────────────────────────────────────────────────
        copy.Status = request.NewStatus;
        copy.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true);
    }
}

/// <summary>Handles assigning or moving a book copy to a shelf location.</summary>
public sealed class UpdateCopyLocationHandler : IRequestHandler<UpdateCopyLocationRequest, ApiResponse<bool>>
{
    private readonly CatalogDbContext _db;
    private readonly IValidator<UpdateCopyLocationRequest> _validator;

    public UpdateCopyLocationHandler(CatalogDbContext db, IValidator<UpdateCopyLocationRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateCopyLocationRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<bool>.Fail(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var copy = await _db.BookCopies.FindAsync([request.CopyId], ct);
        if (copy is null)
            return ApiResponse<bool>.Fail($"Bản sao với Id = {request.CopyId} không tồn tại.");

        if (request.LocationId.HasValue)
        {
            var locationError = await CopyLocationValidationHelper.ValidateAsync(
                _db, request.LocationId.Value, excludingCopyId: copy.Id, ct);
            if (locationError is not null)
                return ApiResponse<bool>.Fail(locationError);
        }

        copy.LocationId = request.LocationId;
        copy.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true);
    }
}

internal static class CopyLocationValidationHelper
{
    public static async Task<string?> ValidateAsync(
        CatalogDbContext db,
        int locationId,
        int? excludingCopyId,
        CancellationToken ct)
    {
        var location = await db.Locations
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == locationId, ct);

        if (location is null || !location.IsActive)
            return $"Vị trí với Id = {locationId} không tồn tại hoặc đã bị vô hiệu hóa.";

        if (location.MaxCapacity.HasValue)
        {
            var currentCount = await db.BookCopies.CountAsync(
                c => c.LocationId == locationId && (!excludingCopyId.HasValue || c.Id != excludingCopyId.Value),
                ct);

            if (currentCount >= location.MaxCapacity.Value)
                return $"Kệ '{location.Aisle} - {location.Shelf} - Tầng {location.RowLevel}' đã đạt sức chứa tối đa ({location.MaxCapacity.Value} bản sao).";
        }

        return null;
    }
}
