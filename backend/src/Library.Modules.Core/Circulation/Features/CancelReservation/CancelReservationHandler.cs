using FluentValidation;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;

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

        var res = await _db.Set<Reservation>().FindAsync(new object[] { request.ReservationId }, ct);
        if (res == null) return ApiResponse<bool>.Fail("Reservation not found.");

        // Allow cancellation if waiting or ready
        if (res.Status != ReservationStatus.Waiting && res.Status != ReservationStatus.Ready)
            return ApiResponse<bool>.Fail("Cannot cancel in current status.");

        res.Status = ReservationStatus.Cancelled;
        res.CancelledAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
