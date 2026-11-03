using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ReserveBook;

public sealed class ReserveBookHandler : IRequestHandler<ReserveBookRequest, ApiResponse<long>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<ReserveBookRequest> _validator;

    public ReserveBookHandler(AppDbContext db, IValidator<ReserveBookRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<long>> Handle(ReserveBookRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<long>.Fail(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == request.AccountId, ct);
        if (account is null)
            return ApiResponse<long>.Fail("Tài khoản không tồn tại.");

        if (account.Status != AccountStatus.Active)
            return ApiResponse<long>.Fail("Tài khoản đang bị khóa hoặc vô hiệu hóa, không thể đặt trước sách.");

        var hasOverdueLoans = await _db.LoanSlips
            .AnyAsync(l => l.AccountId == request.AccountId && l.Status == LoanStatus.Overdue, ct);
        if (hasOverdueLoans)
            return ApiResponse<long>.Fail("Độc giả có sách quá hạn chưa hoàn trả, không thể đặt trước.");

        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == request.BookId, ct);
        if (book is null)
            return ApiResponse<long>.Fail("Sách không tồn tại.");

        if (book.Status != BookStatus.Active)
            return ApiResponse<long>.Fail("Sách hiện ngưng phục vụ.");

        // Check if reader already has an active reservation for this book
        var alreadyReserved = await _db.Reservations
            .AnyAsync(r => r.AccountId == request.AccountId &&
                           r.BookId == request.BookId &&
                           (r.Status == ReservationStatus.Waiting || r.Status == ReservationStatus.Ready), ct);
        if (alreadyReserved)
            return ApiResponse<long>.Fail("Bạn đã có một yêu cầu đặt trước đang chờ hoặc sẵn sàng cho cuốn sách này.");

        BookCopy? assignedCopy = null;

        if (request.BookCopyId.HasValue)
        {
            assignedCopy = await _db.BookCopies.FirstOrDefaultAsync(c => c.Id == request.BookCopyId.Value, ct);
            if (assignedCopy == null || assignedCopy.BookId != request.BookId)
                return ApiResponse<long>.Fail("Bản sao sách không tồn tại hoặc không thuộc về cuốn sách này.");
            
            if (assignedCopy.Status != CopyStatus.Available)
                return ApiResponse<long>.Fail("Bản sao sách không sẵn sàng để đặt trước.");
        }
        else
        {
            // Auto-assign first available copy if one exists
            assignedCopy = await _db.BookCopies
                .FirstOrDefaultAsync(c => c.BookId == request.BookId && c.Status == CopyStatus.Available, ct);
        }

        DateTime? expiresAt = null;
        var status = ReservationStatus.Waiting;

        if (assignedCopy != null)
        {
            assignedCopy.Status = CopyStatus.Reserved;
            assignedCopy.UpdatedAt = DateTime.UtcNow;
            status = ReservationStatus.Ready;
            expiresAt = DateTime.UtcNow.AddDays(3); // Giữ chỗ tối đa 3 ngày
        }

        var reservation = new Reservation
        {
            AccountId = request.AccountId,
            BookId = request.BookId,
            BookCopyId = assignedCopy?.Id,
            ReservedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt,
            Status = status
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<long>.Ok(reservation.Id);
    }
}
