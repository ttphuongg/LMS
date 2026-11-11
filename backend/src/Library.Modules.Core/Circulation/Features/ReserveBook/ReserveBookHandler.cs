using FluentValidation;
using Library.Modules.Core.Billing.Contracts;
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

        if (account.Status == "Suspended")
            return ApiResponse<long>.Fail("Tài khoản đang bị tạm ngưng quyền đặt trước sách. Vui lòng hoàn trả các tài liệu quá hạn hoặc thanh toán phí phạt.");

        if (!account.IsActive)
            return ApiResponse<long>.Fail("Tài khoản bị khóa hoặc không hoạt động, không thể đặt trước hoặc mượn sách.");

        var books = await _sender.Send(new GetBookInfosQuery([request.BookId]), ct);
        if (!books.TryGetValue(request.BookId, out var bookInfo))
            return ApiResponse<long>.Fail("Sách không tồn tại.");
        if (!bookInfo.IsActive)
            return ApiResponse<long>.Fail("Tài liệu này hiện đang ngừng lưu hành.");

        // Kiểm tra độc giả có đang giữ sách quá hạn hoặc còn nợ phạt chưa thanh toán không (đồng nhất với BorrowBookHandler)
        var today = VietnamTime.Today();
        var hasOverdue = await _db.LoanSlipDetails.AnyAsync(d =>
            d.LoanSlip.AccountId == request.AccountId &&
            d.Status == LoanDetailStatus.Borrowing &&
            (d.DueDate != null ? d.DueDate < today : d.LoanSlip.DueDate < today), ct);
        if (hasOverdue)
            return ApiResponse<long>.Fail("Bạn đang có sách quá hạn trả. Vui lòng hoàn trả sách quá hạn trước khi đặt trước hoặc mượn thêm.");

        var hasUnpaidFine = await _sender.Send(new HasUnpaidFinesQuery(request.AccountId), ct);
        if (hasUnpaidFine)
            return ApiResponse<long>.Fail("Tài khoản của bạn còn khoản phạt chưa thanh toán. Vui lòng xử lý nợ phạt trước khi đặt trước hoặc mượn sách.");

        // ── Giới hạn số lượng đặt trước (Tối đa 3 yêu cầu đang hoạt động: Waiting hoặc Ready) ──
        const int MaxActiveReservations = 3;
        var activeReservationsCount = await _db.Reservations.CountAsync(r =>
            r.AccountId == request.AccountId &&
            (r.Status == ReservationStatus.Waiting || r.Status == ReservationStatus.Ready), ct);
        if (activeReservationsCount >= MaxActiveReservations)
            return ApiResponse<long>.Fail(
                $"Bạn đã đạt giới hạn tối đa {MaxActiveReservations} yêu cầu đặt trước sách đang hoạt động (đang chờ hoặc sẵn sàng nhận). Vui lòng hoàn tất nhận sách hoặc hủy bớt yêu cầu trước khi đặt thêm.");

        var alreadyReserved = await _db.Reservations.AnyAsync(r =>
            r.AccountId == request.AccountId &&
            r.BookId == request.BookId &&
            (r.Status == ReservationStatus.Waiting || r.Status == ReservationStatus.Ready), ct);

        if (alreadyReserved)
            return ApiResponse<long>.Fail("Bạn đã có một yêu cầu đặt trước đang chờ hoặc sẵn sàng nhận cho cuốn sách này.");

        var activeBorrowedCopyIds = await _db.LoanSlipDetails
            .Where(d => d.LoanSlip.AccountId == request.AccountId && d.Status == LoanDetailStatus.Borrowing)
            .Select(d => d.BookCopyId)
            .Distinct()
            .ToListAsync(ct);

        if (activeBorrowedCopyIds.Count > 0)
        {
            var borrowedCopies = await _sender.Send(new GetCopyInfosQuery(activeBorrowedCopyIds), ct);
            if (borrowedCopies.Values.Any(c => c.BookId == request.BookId))
                return ApiResponse<long>.Fail("Bạn đang mượn một bản sao của cuốn sách này, không thể đặt trước thêm.");
        }

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
