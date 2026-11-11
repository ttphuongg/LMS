using FluentValidation;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Circulation.Services;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ReserveBook;

public sealed class ReserveBookHandler : IRequestHandler<ReserveBookRequest, ApiResponse<long>>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;
    private readonly IValidator<ReserveBookRequest> _validator;
    private readonly IMediator _mediator;

    public ReserveBookHandler(CirculationDbContext db, ISender sender, IValidator<ReserveBookRequest> validator, IMediator mediator)
    {
        _db = db;
        _sender = sender;
        _validator = validator;
        _mediator = mediator;
    }

    public async Task<ApiResponse<long>> Handle(ReserveBookRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<long>.Fail(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var account = await _sender.Send(new GetAccountSummaryQuery(request.AccountId), ct);
        if (account is null)
            return ApiResponse<long>.Fail("Tài khoản không tồn tại.");

        var books = await _sender.Send(new GetBookInfosQuery([request.BookId]), ct);
        if (!books.TryGetValue(request.BookId, out var bookInfo))
            return ApiResponse<long>.Fail("Sách không tồn tại.");
        if (!bookInfo.IsActive)
            return ApiResponse<long>.Fail("Tài liệu này hiện đang ngừng lưu hành.");

        var alreadyReserved = await _db.Reservations.AnyAsync(r =>
            r.AccountId == request.AccountId &&
            r.BookId == request.BookId &&
            (r.Status == ReservationStatus.Waiting || r.Status == ReservationStatus.Ready), ct);

        if (alreadyReserved)
            return ApiResponse<long>.Fail("Bạn đã có một yêu cầu đặt trước đang chờ hoặc sẵn sàng nhận cho cuốn sách này.");

        CopyInfo? assignedCopy = null;

        if (request.BookCopyId.HasValue)
        {
            var copyInfo = await _sender.Send(new FindAvailableCopyQuery(request.BookId, request.BookCopyId.Value), ct);
            if (copyInfo == null || copyInfo.CopyId != request.BookCopyId.Value)
                return ApiResponse<long>.Fail("Bản sao sách không sẵn sàng để đặt trước.");

            var setOk = await _sender.Send(new SetCopyStatusCommand(copyInfo.CopyId, CopyStatus.Available, CopyStatus.Reserved), ct);
            if (!setOk)
                return ApiResponse<long>.Fail("Không thể giữ bản sao này.");

            assignedCopy = copyInfo;
        }
        else
        {
            var copyInfo = await _sender.Send(new FindAvailableCopyQuery(request.BookId), ct);
            if (copyInfo != null)
            {
                var setOk = await _sender.Send(new SetCopyStatusCommand(copyInfo.CopyId, CopyStatus.Available, CopyStatus.Reserved), ct);
                if (setOk)
                {
                    assignedCopy = copyInfo;
                }
            }
        }

        var isReady = assignedCopy != null;
        var expiresAt = isReady ? DateTime.UtcNow.Add(ReservationQueue.PickupWindow) : (DateTime?)null;

        var reservation = new Reservation
        {
            AccountId = request.AccountId,
            BookId = request.BookId,
            BookCopyId = assignedCopy?.CopyId,
            Status = isReady ? ReservationStatus.Ready : ReservationStatus.Waiting,
            ExpiresAt = expiresAt
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync(ct);

        if (isReady && assignedCopy != null)
        {
            await _mediator.Publish(new ReservationReadyEvent(
                reservation.Id,
                reservation.AccountId,
                reservation.BookCopyId,
                reservation.ExpiresAt), ct);
        }

        return ApiResponse<long>.Ok(reservation.Id);
    }
}
