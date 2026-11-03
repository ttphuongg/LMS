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

        var copyIdsToUpdate = loanSlip.Details
            .Where(d => request.ReturnedCopies.Any(r => r.LoanSlipDetailId == d.Id))
            .Select(d => d.BookCopyId)
            .ToList();

        var bookCopies = await _db.BookCopies.Where(c => copyIdsToUpdate.Contains(c.Id)).ToListAsync(ct);

        foreach (var ret in request.ReturnedCopies)
        {
            var detail = loanSlip.Details.FirstOrDefault(d => d.Id == ret.LoanSlipDetailId);
            if (detail != null && detail.Status == LoanDetailStatus.Borrowing)
            {
                detail.Status = LoanDetailStatus.Returned;
                detail.ActualReturnDate = DateOnly.FromDateTime(DateTime.UtcNow);
                detail.Notes = ret.Notes;

                var copy = bookCopies.FirstOrDefault(c => c.Id == detail.BookCopyId);
                if (copy != null)
                {
                    copy.Status = CopyStatus.Available;
                }
            }
        }

        // Check if all details are returned
        if (loanSlip.Details.All(d => d.Status != LoanDetailStatus.Borrowing))
        {
            loanSlip.Status = LoanStatus.Returned;
            loanSlip.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
