using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Dashboard.Features.GetDashboardStats;

public sealed class GetDashboardStatsHandler : IRequestHandler<GetDashboardStatsRequest, ApiResponse<DashboardStatsDto>>
{
    private readonly ISender _sender;

    public GetDashboardStatsHandler(ISender sender) => _sender = sender;

    public async Task<ApiResponse<DashboardStatsDto>> Handle(GetDashboardStatsRequest request, CancellationToken ct)
    {
        var todayVn = VietnamTime.Today();
        var (startUtc, endUtc) = VietnamTime.GetUtcDayRange(todayVn);

        // Các module DbContext dùng chung scoped SqlConnection (MARS tắt) nên gọi tuần tự qua MediatR contracts
        var totalBooks = await _sender.Send(new GetActiveBookCopiesCountQuery(), ct);
        var totalBookTitles = await _sender.Send(new GetActiveBookTitlesCountQuery(), ct);
        var circulation = await _sender.Send(new GetCirculationStatsQuery(todayVn, startUtc, endUtc), ct);
        var totalUsers = await _sender.Send(new GetTotalAccountsCountQuery(), ct);
        var unpaidFinesTotal = await _sender.Send(new GetUnpaidFinesTotalQuery(), ct);

        var dto = new DashboardStatsDto(
            TotalBooks: totalBooks,
            TotalActiveLoans: circulation.TotalActiveLoans,
            TotalOverdueLoans: circulation.TotalOverdueLoans,
            PendingReservations: circulation.PendingReservations,
            TodayLoans: circulation.TodayLoans,
            TodayReturns: circulation.TodayReturns,
            TotalUsers: totalUsers,
            UnpaidFinesTotal: unpaidFinesTotal,
            TotalBookTitles: totalBookTitles,
            PendingRenewals: circulation.PendingRenewals,
            ReadyReservations: circulation.ReadyReservations,
            WaitingReservations: circulation.WaitingReservations,
            DueTodayLoans: circulation.DueTodayLoans
        );

        return ApiResponse<DashboardStatsDto>.Ok(dto);
    }
}

