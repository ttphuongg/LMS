using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetMyReservations;

public sealed class GetMyReservationsHandler : IRequestHandler<GetMyReservationsRequest, ApiResponse<List<MyReservationDto>>>
{
    private readonly AppDbContext _db;
    public GetMyReservationsHandler(AppDbContext db) => _db = db;

    public async Task<ApiResponse<List<MyReservationDto>>> Handle(GetMyReservationsRequest request, CancellationToken ct)
    {
        var reservations = await _db.Reservations
            .AsNoTracking()
            .Where(r => r.AccountId == request.AccountId)
            .OrderByDescending(r => r.ReservedAt)
            .ToListAsync(ct);

        var bookIds = reservations.Select(r => r.BookId).Distinct().ToList();
        var titles = await _db.Books
            .AsNoTracking()
            .Where(b => bookIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.Title, ct);

        var copyIds = reservations
            .Where(r => r.BookCopyId.HasValue)
            .Select(r => r.BookCopyId!.Value)
            .Distinct()
            .ToList();
        var barcodes = await _db.BookCopies
            .AsNoTracking()
            .Where(c => copyIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.Barcode, ct);

        var result = reservations.Select(r =>
        {
            titles.TryGetValue(r.BookId, out var title);
            string? barcode = null;
            if (r.BookCopyId.HasValue && barcodes.TryGetValue(r.BookCopyId.Value, out var bc))
                barcode = bc;

            return new MyReservationDto(
                r.Id,
                r.BookId,
                title,
                r.BookCopyId,
                barcode,
                r.Status.ToString(),
                r.ReservedAt,
                r.ExpiresAt);
        }).ToList();

        return ApiResponse<List<MyReservationDto>>.Ok(result);
    }
}
