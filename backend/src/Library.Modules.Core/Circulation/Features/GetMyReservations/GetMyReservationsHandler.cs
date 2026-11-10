using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetMyReservations;

public sealed class GetMyReservationsHandler : IRequestHandler<GetMyReservationsRequest, ApiResponse<List<MyReservationDto>>>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;

    public GetMyReservationsHandler(CirculationDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task<ApiResponse<List<MyReservationDto>>> Handle(GetMyReservationsRequest request, CancellationToken ct)
    {
        var reservations = await _db.Reservations
            .AsNoTracking()
            .Where(r => r.AccountId == request.AccountId)
            .OrderByDescending(r => r.ReservedAt)
            .ToListAsync(ct);

        var bookIds = reservations.Select(r => r.BookId).Distinct().ToList();
        var bookDict = await _sender.Send(new GetBookInfosQuery(bookIds), ct);

        var copyIds = reservations
            .Where(r => r.BookCopyId.HasValue)
            .Select(r => r.BookCopyId!.Value)
            .Distinct()
            .ToList();
        var copyDict = await _sender.Send(new GetCopyInfosQuery(copyIds), ct);

        var result = reservations.Select(r =>
        {
            bookDict.TryGetValue(r.BookId, out var book);
            string? barcode = null;
            if (r.BookCopyId.HasValue && copyDict.TryGetValue(r.BookCopyId.Value, out var copy))
                barcode = copy.Barcode;

            return new MyReservationDto(
                r.Id,
                r.BookId,
                book?.Title,
                r.BookCopyId,
                barcode,
                r.Status.ToString(),
                r.ReservedAt,
                r.ExpiresAt);
        }).ToList();

        return ApiResponse<List<MyReservationDto>>.Ok(result);
    }
}
