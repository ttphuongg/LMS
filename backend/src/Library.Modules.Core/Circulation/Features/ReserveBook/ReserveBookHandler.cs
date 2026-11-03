using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
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

        var accountExists = await _db.Accounts.AnyAsync(a => a.Id == request.AccountId, ct);
        if (!accountExists)
            return ApiResponse<long>.Fail("Tài khoản không tồn tại.");

        var bookExists = await _db.Books.AnyAsync(b => b.Id == request.BookId, ct);
        if (!bookExists)
            return ApiResponse<long>.Fail("Sách không tồn tại.");

        if (request.BookCopyId.HasValue)
        {
            var copy = await _db.BookCopies.FirstOrDefaultAsync(c => c.Id == request.BookCopyId.Value, ct);
            if (copy == null || copy.BookId != request.BookId)
                return ApiResponse<long>.Fail("Bản sao sách không tồn tại hoặc không thuộc về cuốn sách này.");
            
            if (copy.Status != CopyStatus.Available)
                return ApiResponse<long>.Fail("Bản sao sách không sẵn sàng để đặt trước.");
                
            copy.Status = CopyStatus.Reserved;
        }

        var reservation = new Reservation
        {
            AccountId = request.AccountId,
            BookId = request.BookId,
            BookCopyId = request.BookCopyId,
            Status = request.BookCopyId.HasValue ? ReservationStatus.Ready : ReservationStatus.Waiting
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<long>.Ok(reservation.Id);
    }
}
