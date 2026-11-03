using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetAllReservations;

public sealed class GetAllReservationsHandler : IRequestHandler<GetAllReservationsRequest, ApiResponse<GetAllReservationsResult>>
{
    private readonly AppDbContext _db;
    public GetAllReservationsHandler(AppDbContext db) => _db = db;

    public async Task<ApiResponse<GetAllReservationsResult>> Handle(GetAllReservationsRequest request, CancellationToken ct)
    {
        IQueryable<Reservation> query = _db.Reservations.AsNoTracking();

        if (request.Status.HasValue && Enum.IsDefined(typeof(ReservationStatus), request.Status.Value))
            query = query.Where(r => r.Status == (ReservationStatus)request.Status.Value);

        var page = Math.Max(request.Page, 1);
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 100);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(r => r.ReservedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReservationSummaryDto(r.Id, r.AccountId, r.BookId, r.BookCopyId, r.Status.ToString(), r.ReservedAt, null, null))
            .ToListAsync(ct);

        // Attach reader names and book titles for this page
        var accountIds = items.Select(i => i.AccountId).Distinct().ToList();
        var names = await _db.Accounts
            .AsNoTracking()
            .Where(a => accountIds.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, a => a.FullName, ct);

        var bookIds = items.Select(i => i.BookId).Distinct().ToList();
        var titles = await _db.Books
            .AsNoTracking()
            .Where(b => bookIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.Title, ct);

        items = items.Select(i => i with
        {
            ReaderName = names.GetValueOrDefault(i.AccountId),
            BookTitle = titles.GetValueOrDefault(i.BookId)
        }).ToList();

        return ApiResponse<GetAllReservationsResult>.Ok(new GetAllReservationsResult(items, total));
    }
}
