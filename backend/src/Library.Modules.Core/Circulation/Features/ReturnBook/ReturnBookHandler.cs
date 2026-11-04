using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ReturnBook;

public sealed class ReturnBookHandler : IRequestHandler<ReturnBookRequest, ApiResponse<bool>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<ReturnBookRequest> _validator;

    public ReturnBookHandler(AppDbContext db, IValidator<ReturnBookRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(ReturnBookRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<bool>.Fail(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var loanSlip = await _db.LoanSlips
            .Include(l => l.Details)
            .FirstOrDefaultAsync(l => l.Id == request.LoanSlipId, ct);

        if (loanSlip == null)
            return ApiResponse<bool>.Fail("Phiếu mượn không tồn tại.");

        if (loanSlip.Status == LoanStatus.Returned || loanSlip.Status == LoanStatus.Cancelled)
            return ApiResponse<bool>.Fail("Phiếu mượn này đã được hoàn tất hoặc đã bị hủy.");

        var requestedDetailIds = request.ReturnedCopies.Select(r => r.LoanSlipDetailId).ToHashSet();
        var validDetails = loanSlip.Details.Where(d => requestedDetailIds.Contains(d.Id)).ToList();

        if (validDetails.Count == 0)
            return ApiResponse<bool>.Fail("Không có chi tiết mượn sách nào thuộc phiếu mượn này được tìm thấy.");

        var activeBorrowingDetails = validDetails.Where(d => d.Status == LoanDetailStatus.Borrowing).ToList();
        if (activeBorrowingDetails.Count == 0)
            return ApiResponse<bool>.Fail("Các sách được chọn đều đã được trả hoặc xử lý trước đó.");

        var copyIdsToUpdate = activeBorrowingDetails.Select(d => d.BookCopyId).ToList();
        var bookCopies = await _db.BookCopies
            .Where(c => copyIdsToUpdate.Contains(c.Id))
            .ToListAsync(ct);

        foreach (var detail in activeBorrowingDetails)
        {
            var returnInfo = request.ReturnedCopies.First(r => r.LoanSlipDetailId == detail.Id);
            detail.Status = LoanDetailStatus.Returned;
            detail.ActualReturnDate = DateOnly.FromDateTime(DateTime.UtcNow);
            detail.Notes = returnInfo.Notes;
            detail.UpdatedAt = DateTime.UtcNow;
            detail.UpdatedBy = request.LibrarianId;

            var copy = bookCopies.FirstOrDefault(c => c.Id == detail.BookCopyId);
            if (copy != null)
            {
                copy.UpdatedAt = DateTime.UtcNow;
                if (copy.Condition == CopyCondition.MajorDamage)
                {
                    copy.Status = CopyStatus.Maintenance;
                }
                else
                {
                    // Check if another reader is waiting for this book (FIFO)
                    var nextReservation = await _db.Reservations
                        .Where(r => r.BookId == copy.BookId && r.Status == ReservationStatus.Waiting)
                        .OrderBy(r => r.ReservedAt)
                        .FirstOrDefaultAsync(ct);

                    if (nextReservation != null)
                    {
                        nextReservation.BookCopyId = copy.Id;
                        nextReservation.Status = ReservationStatus.Ready;
                        nextReservation.ExpiresAt = DateTime.UtcNow.AddDays(3);
                        copy.Status = CopyStatus.Reserved;
                    }
                    else
                    {
                        copy.Status = CopyStatus.Available;
                    }
                }
            }
        }

        // Check if all details in the loan slip are completed
        if (loanSlip.Details.All(d => d.Status != LoanDetailStatus.Borrowing))
        {
            loanSlip.Status = LoanStatus.Returned;
        }

        loanSlip.UpdatedAt = DateTime.UtcNow;
        loanSlip.UpdatedBy = request.LibrarianId;

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
