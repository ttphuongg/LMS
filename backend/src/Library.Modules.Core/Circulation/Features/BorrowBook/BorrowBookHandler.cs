using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
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

        // ── Verify account exists ─────────────────────────────────────────────
        var accountExists = await _db.Accounts.AnyAsync(a => a.Id == request.AccountId, ct);
        if (!accountExists)
            return ApiResponse<long>.Fail($"Tài khoản với Id = {request.AccountId} không tồn tại.");

        // ── Check book copies availability ────────────────────────────────────
        var distinctCopyIds = request.BookCopyIds.Distinct().ToList();
        var copies = await _db.BookCopies
            .Where(c => distinctCopyIds.Contains(c.Id))
            .ToListAsync(ct);

        if (copies.Count != distinctCopyIds.Count)
            return ApiResponse<long>.Fail("Một hoặc nhiều bản sao sách không tồn tại.");

        var unavailableCopies = copies.Where(c => c.Status != CopyStatus.Available).ToList();
        if (unavailableCopies.Any())
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
            Status = LoanStatus.Borrowing
        };

        foreach (var copy in copies)
        {
            // Update copy status
            copy.Status = CopyStatus.Borrowed;

            // Add detail
            loanSlip.Details.Add(new LoanSlipDetail
            {
                BookCopyId = copy.Id,
                Status = LoanDetailStatus.Borrowing
            });
        }

        _db.LoanSlips.Add(loanSlip);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<long>.Ok(loanSlip.Id);
    }
}
