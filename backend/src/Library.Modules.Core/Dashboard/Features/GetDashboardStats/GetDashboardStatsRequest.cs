using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Dashboard.Features.GetDashboardStats;

public record GetDashboardStatsRequest() : IRequest<ApiResponse<DashboardStatsDto>>;

public record DashboardStatsDto(
    int TotalBooks,
    int TotalActiveLoans,
    int TotalOverdueLoans,
    int PendingReservations,
    int TodayLoans,
    int TodayReturns,
    int TotalUsers,
    decimal UnpaidFinesTotal,
    int TotalBookTitles = 0,
    int PendingRenewals = 0,
    int ReadyReservations = 0,
    int WaitingReservations = 0,
    int DueTodayLoans = 0
);

