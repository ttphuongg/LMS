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
    private readonly IValidator<CancelReservationRequest> _validator;
    private readonly ISender _sender;

    public CancelReservationHandler(CirculationDbContext db, IValidator<CancelReservationRequest> validator, ISender sender)
    {
        _db = db;
        _validator = validator;
        _sender = sender;
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
            var copyDict = await _sender.Send(new GetCopyInfosQuery([res.BookCopyId.Value]), ct);
            if (copyDict.TryGetValue(res.BookCopyId.Value, out var copy) && copy.Status == CopyStatus.Reserved)
            {
                var newStatus = await _sender.Send(new ReleaseCopyCommand(res.BookId, copy.CopyId, res.Id), ct);
                await _sender.Send(new SetCopyStatusCommand(copy.CopyId, null, newStatus, copy.Condition), ct);
            }
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
