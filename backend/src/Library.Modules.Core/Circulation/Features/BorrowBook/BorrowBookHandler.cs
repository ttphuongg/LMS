using FluentValidation;
using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.BorrowBook;

public sealed class BorrowBookHandler : IRequestHandler<BorrowBookRequest, ApiResponse<long>>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;
    private readonly IValidator<BorrowBookRequest> _validator;

    public BorrowBookHandler(CirculationDbContext db, ISender sender, IValidator<BorrowBookRequest> validator)
    {
        _db = db;
        _sender = sender;
        _validator = validator;
    }

    public async Task<ApiResponse<long>> Handle(BorrowBookRequest request, CancellationToken ct)
    {
        // ── Validate input ────────────────────────────────────────────────────
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<long>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        // ── Verify account exists & active ────────────────────────────────────
        var account = await _sender.Send(new GetAccountSummaryQuery(request.AccountId), ct);
        if (account is null)
            return ApiResponse<long>.Fail($"Tài khoản với Id = {request.AccountId} không tồn tại.");

        if (!account.IsActive)
            return ApiResponse<long>.Fail("Tài khoản bị khóa hoặc không hoạt động, không thể mượn sách.");

        // ── Giới hạn mượn ─────────────────────────────────────────────────────
        const int MaxActiveLoans = 5;
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));

        var hasOverdue = await _db.LoanSlipDetails.AnyAsync(d =>
            d.LoanSlip.AccountId == request.AccountId &&
            d.Status == LoanDetailStatus.Borrowing &&
            (d.DueDate != null ? d.DueDate < today : d.LoanSlip.DueDate < today), ct);
        if (hasOverdue)
            return ApiResponse<long>.Fail("Độc giả đang có sách quá hạn, không thể mượn thêm.");

        var hasUnpaidFine = await _sender.Send(new HasUnpaidFinesQuery(request.AccountId), ct);
        if (hasUnpaidFine)
            return ApiResponse<long>.Fail("Độc giả còn khoản phạt chưa thanh toán.");

        var activeCount = await _db.LoanSlipDetails.CountAsync(d =>
            d.LoanSlip.AccountId == request.AccountId &&
            d.Status == LoanDetailStatus.Borrowing, ct);
        var distinctCopyIds = request.BookCopyIds.Distinct().ToList();
        var newCount = distinctCopyIds.Count;
        if (activeCount + newCount > MaxActiveLoans)
            return ApiResponse<long>.Fail(
                $"Vượt giới hạn {MaxActiveLoans} cuốn (đang mượn {activeCount}, muốn mượn thêm {newCount}).");

        // ── Check book copies availability ────────────────────────────────────
        var copyInfos = await _sender.Send(new GetCopyInfosQuery(distinctCopyIds), ct);
        if (copyInfos.Count != distinctCopyIds.Count)
            return ApiResponse<long>.Fail("Một hoặc nhiều bản sao sách không tồn tại.");

        // Bản sao Reserved vẫn mượn được nếu chính độc giả này có đặt trước Ready còn hạn
        var now = DateTime.UtcNow;
        var readyReservations = await _db.Reservations
            .Where(r => r.AccountId == request.AccountId
                     && r.Status == ReservationStatus.Ready
                     && r.BookCopyId != null
                     && distinctCopyIds.Contains(r.BookCopyId.Value)
                     && (r.ExpiresAt == null || r.ExpiresAt > now))
            .ToListAsync(ct);
        var reservedForBorrower = readyReservations.Select(r => r.BookCopyId!.Value).ToHashSet();

        var unavailableCopies = copyInfos.Values
            .Where(c => c.Status != CopyStatus.Available
                     && !(c.Status == CopyStatus.Reserved && reservedForBorrower.Contains(c.CopyId)))
            .ToList();
        if (unavailableCopies.Any())
        {
            var unavailableIds = string.Join(", ", unavailableCopies.Select(c => c.CopyId));
            return ApiResponse<long>.Fail($"Các bản sao sách sau không sẵn sàng để mượn: {unavailableIds}");
        }

        // ── Create LoanSlip & Details ─────────────────────────────────────────
        var loanSlip = new LoanSlip
        {
            AccountId = request.AccountId,
            LibrarianId = request.LibrarianId,
            DueDate = request.DueDate,
            Notes = request.Notes,
            Status = LoanStatus.Borrowing
        };

        foreach (var copy in copyInfos.Values)
        {
            var expectedStatus = reservedForBorrower.Contains(copy.CopyId) ? CopyStatus.Reserved : CopyStatus.Available;
            var setSuccess = await _sender.Send(new SetCopyStatusCommand(copy.CopyId, expectedStatus, CopyStatus.Borrowed), ct);
            if (!setSuccess)
                return ApiResponse<long>.Fail($"Bản sao {copy.Barcode} không còn sẵn sàng.");

            loanSlip.Details.Add(new LoanSlipDetail
            {
                BookCopyId = copy.CopyId,
                DueDate = request.DueDate,
                Status = LoanDetailStatus.Borrowing
            });
        }

        foreach (var r in readyReservations)
            r.Status = ReservationStatus.Completed;

        _db.LoanSlips.Add(loanSlip);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<long>.Ok(loanSlip.Id);
    }
}
