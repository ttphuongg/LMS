using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.BorrowBook;

public sealed class BorrowBookHandler : IRequestHandler<BorrowBookRequest, ApiResponse<long>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<BorrowBookRequest> _validator;

    public BorrowBookHandler(AppDbContext db, IValidator<BorrowBookRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<long>> Handle(BorrowBookRequest request, CancellationToken ct)
    {
        // ── Validate input ────────────────────────────────────────────────────
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<long>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        // ── Verify account exists and is active ───────────────────────────────
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == request.AccountId, ct);
        if (account is null)
            return ApiResponse<long>.Fail($"Tài khoản với Id = {request.AccountId} không tồn tại.");

        if (account.Status != AccountStatus.Active)
            return ApiResponse<long>.Fail("Tài khoản của độc giả đang bị khóa hoặc vô hiệu hóa, không thể mượn sách.");

        // ── Check if account has any overdue loans ───────────────────────────
        var hasOverdueLoans = await _db.LoanSlips
            .AnyAsync(l => l.AccountId == request.AccountId && l.Status == LoanStatus.Overdue, ct);
        if (hasOverdueLoans)
            return ApiResponse<long>.Fail("Độc giả hiện có sách quá hạn chưa trả. Vui lòng hoàn tất trả sách trước khi mượn mới.");

        // ── Check borrowing limit (e.g. max 5 books) ──────────────────────────
        var distinctCopyIds = request.BookCopyIds.Distinct().ToList();
        var currentBorrowingCount = await _db.LoanSlipDetails
            .CountAsync(d => d.LoanSlip.AccountId == request.AccountId && d.Status == LoanDetailStatus.Borrowing, ct);

        const int maxBorrowLimit = 5;
        if (currentBorrowingCount + distinctCopyIds.Count > maxBorrowLimit)
            return ApiResponse<long>.Fail($"Độc giả đang mượn {currentBorrowingCount} cuốn. Mượn thêm {distinctCopyIds.Count} cuốn sẽ vượt giới hạn tối đa ({maxBorrowLimit} cuốn).");

        // ── Check book copies ─────────────────────────────────────────────────
        var copies = await _db.BookCopies
            .Include(c => c.Book)
            .Where(c => distinctCopyIds.Contains(c.Id))
            .ToListAsync(ct);

        if (copies.Count != distinctCopyIds.Count)
            return ApiResponse<long>.Fail("Một hoặc nhiều bản sao sách không tồn tại.");

        foreach (var copy in copies)
        {
            if (copy.Book.Status != BookStatus.Active)
                return ApiResponse<long>.Fail($"Đầu sách '{copy.Book.Title}' hiện ngưng phục vụ.");

            if (copy.Condition == CopyCondition.Lost || copy.Condition == CopyCondition.MajorDamage)
                return ApiResponse<long>.Fail($"Bản sao '{copy.Barcode}' không đủ điều kiện cho mượn do hư hại hoặc mất ({copy.Condition}).");
        }

        // ── Check availability & reservation matching ─────────────────────────
        var reservedCopyIds = copies.Where(c => c.Status == CopyStatus.Reserved).Select(c => c.Id).ToList();
        var matchingReservations = new List<Reservation>();

        if (reservedCopyIds.Count > 0)
        {
            matchingReservations = await _db.Reservations
                .Where(r => r.AccountId == request.AccountId &&
                            r.Status == ReservationStatus.Ready &&
                            r.BookCopyId.HasValue &&
                            reservedCopyIds.Contains(r.BookCopyId.Value))
                .ToListAsync(ct);

            var reservedForOtherIds = reservedCopyIds
                .Except(matchingReservations.Select(r => r.BookCopyId!.Value))
                .ToList();

            if (reservedForOtherIds.Count > 0)
            {
                return ApiResponse<long>.Fail($"Các bản sao sách sau đang được đặt trước cho độc giả khác: {string.Join(", ", reservedForOtherIds)}");
            }
        }

        var unavailableCopies = copies
            .Where(c => c.Status != CopyStatus.Available && c.Status != CopyStatus.Reserved)
            .ToList();

        if (unavailableCopies.Count > 0)
        {
            var unavailableIds = string.Join(", ", unavailableCopies.Select(c => c.Id));
            return ApiResponse<long>.Fail($"Các bản sao sách sau không sẵn sàng để mượn: {unavailableIds}");
        }

        // ── Create LoanSlip & Details ─────────────────────────────────────────
        var loanSlip = new LoanSlip
        {
            AccountId = request.AccountId,
            LibrarianId = request.LibrarianId,
            DueDate = request.DueDate,
            Notes = request.Notes,
            Status = LoanStatus.Borrowing,
            BorrowedAt = DateTime.UtcNow
        };

        foreach (var copy in copies)
        {
            copy.Status = CopyStatus.Borrowed;
            copy.UpdatedAt = DateTime.UtcNow;

            loanSlip.Details.Add(new LoanSlipDetail
            {
                BookCopyId = copy.Id,
                Status = LoanDetailStatus.Borrowing
            });
        }

        // Fulfill reservations held by this reader
        foreach (var res in matchingReservations)
        {
            res.Status = ReservationStatus.Completed;
        }

        _db.LoanSlips.Add(loanSlip);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ApiResponse<long>.Fail("Bản sao sách vừa được cập nhật bởi một thao tác khác. Vui lòng thử lại.");
        }

        return ApiResponse<long>.Ok(loanSlip.Id);
    }
}
