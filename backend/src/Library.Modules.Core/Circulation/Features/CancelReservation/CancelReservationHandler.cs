using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.CancelReservation;

public sealed class CancelReservationHandler : IRequestHandler<CancelReservationRequest, ApiResponse<bool>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<CancelReservationRequest> _validator;

    public CancelReservationHandler(AppDbContext db, IValidator<CancelReservationRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(CancelReservationRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<bool>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var res = await _db.Reservations.FindAsync(new object[] { request.ReservationId }, ct);
        if (res == null) return ApiResponse<bool>.Fail("Yêu cầu đặt trước không tồn tại.");

        if (!request.IsStaff && res.AccountId != request.AccountId)
            return ApiResponse<bool>.Fail("Bạn không có quyền hủy đặt trước của người khác.");

        if (res.Status != ReservationStatus.Waiting && res.Status != ReservationStatus.Ready)
            return ApiResponse<bool>.Fail("Không thể hủy đặt trước ở trạng thái hiện tại.");

        res.Status = ReservationStatus.Cancelled;
        res.CancelledAt = DateTime.UtcNow;

        // Release or reassign reserved copy
        if (res.BookCopyId.HasValue)
        {
            var copy = await _db.BookCopies.FindAsync(new object[] { res.BookCopyId.Value }, ct);
            if (copy != null && copy.Status == CopyStatus.Reserved)
            {
                var nextWaiting = await _db.Reservations
                    .Where(r => r.BookId == res.BookId && r.Status == ReservationStatus.Waiting && r.Id != res.Id)
                    .OrderBy(r => r.ReservedAt)
                    .FirstOrDefaultAsync(ct);

                if (nextWaiting != null)
                {
                    nextWaiting.BookCopyId = copy.Id;
                    nextWaiting.Status = ReservationStatus.Ready;
                    nextWaiting.ExpiresAt = DateTime.UtcNow.AddDays(3);
                }
                else
                {
                    copy.Status = CopyStatus.Available;
                }
                copy.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
