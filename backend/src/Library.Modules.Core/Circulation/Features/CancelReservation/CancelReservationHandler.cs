using FluentValidation;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.CancelReservation;

public sealed class CancelReservationHandler : IRequestHandler<CancelReservationRequest, ApiResponse<bool>>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;
    private readonly IValidator<CancelReservationRequest> _validator;

    public CancelReservationHandler(CirculationDbContext db, ISender sender, IValidator<CancelReservationRequest> validator)
    {
        _db = db;
        _sender = sender;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(CancelReservationRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<bool>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var res = await _db.Reservations.FirstOrDefaultAsync(r => r.Id == request.ReservationId, ct);
        if (res == null) return ApiResponse<bool>.Fail("Đặt trước không tồn tại.");

        if (res.AccountId != request.AccountId && !request.IsStaff)
            return ApiResponse<bool>.Fail("Bạn không có quyền hủy đặt trước này.");

        if (res.Status != ReservationStatus.Waiting && res.Status != ReservationStatus.Ready)
            return ApiResponse<bool>.Fail("Không thể hủy đặt trước ở trạng thái hiện tại.");

        res.Status = ReservationStatus.Cancelled;
        res.CancelledAt = DateTime.UtcNow;

        if (res.BookCopyId.HasValue)
        {
            var nextStatus = await _sender.Send(new ReleaseCopyCommand(res.BookId, res.BookCopyId.Value, res.Id), ct);
            await _sender.Send(new SetCopyStatusCommand(res.BookCopyId.Value, null, nextStatus), ct);
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
