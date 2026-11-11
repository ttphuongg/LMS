using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetCirculationStats;

public sealed class GetCirculationStatsHandler : IRequestHandler<GetCirculationStatsQuery, CirculationStatsDto>
{
    private readonly CirculationDbContext _db;

    public GetCirculationStatsHandler(CirculationDbContext db) => _db = db;

    public async Task<CirculationStatsDto> Handle(GetCirculationStatsQuery request, CancellationToken ct)
    {
        var todayVn = request.TodayVn;
        var startUtc = request.StartUtc;
        var endUtc = request.EndUtc;

        // Thực hiện tuần tự từng truy vấn nhẹ trên cùng một DbContext instance (dùng chung scoped DbConnection)
        var totalActiveLoans = await _db.LoanSlipDetails
            .AsNoTracking()
            .CountAsync(d =>
                d.Status == LoanDetailStatus.Borrowing &&
                d.LoanSlip.Status != LoanStatus.Cancelled, ct);

        var totalOverdueLoans = await _db.LoanSlipDetails
            .AsNoTracking()
            .CountAsync(d =>
                d.Status == LoanDetailStatus.Borrowing &&
                d.LoanSlip.Status != LoanStatus.Cancelled &&
                (d.DueDate
                    ?? d.Renewals.Where(r => r.Status == RenewalStatus.Approved).Max(r => (DateOnly?)r.NewDueDate)
                    ?? d.LoanSlip.DueDate) < todayVn, ct);

        var readyReservations = await _db.Reservations
            .AsNoTracking()
            .CountAsync(r => r.Status == ReservationStatus.Ready, ct);

        var waitingReservations = await _db.Reservations
            .AsNoTracking()
            .CountAsync(r => r.Status == ReservationStatus.Waiting, ct);

        var pendingReservations = readyReservations + waitingReservations;

        var pendingRenewals = await _db.Renewals
            .AsNoTracking()
            .CountAsync(r => r.Status == RenewalStatus.Pending, ct);

        var dueTodayLoans = await _db.LoanSlipDetails
            .AsNoTracking()
            .CountAsync(d =>
                d.Status == LoanDetailStatus.Borrowing &&
                d.LoanSlip.Status != LoanStatus.Cancelled &&
                (d.DueDate
                    ?? d.Renewals.Where(r => r.Status == RenewalStatus.Approved).Max(r => (DateOnly?)r.NewDueDate)
                    ?? d.LoanSlip.DueDate) == todayVn, ct);

        // Đếm tổng số cuốn (LoanSlipDetails) thuộc các phiếu lập trong ngày Việt Nam hôm nay
        var todayLoans = await _db.LoanSlipDetails
            .AsNoTracking()
            .CountAsync(d =>
                d.LoanSlip.Status != LoanStatus.Cancelled &&
                d.LoanSlip.BorrowedAt >= startUtc &&
                d.LoanSlip.BorrowedAt < endUtc, ct);

        var todayReturns = await _db.LoanSlipDetails
            .AsNoTracking()
            .CountAsync(d =>
                d.Status == LoanDetailStatus.Returned &&
                d.ActualReturnDate == todayVn &&
                d.LoanSlip.Status != LoanStatus.Cancelled, ct);

        return new CirculationStatsDto(
            totalActiveLoans,
            totalOverdueLoans,
            pendingReservations,
            todayLoans,
            todayReturns,
            pendingRenewals,
            readyReservations,
            waitingReservations,
            dueTodayLoans);
    }
}

