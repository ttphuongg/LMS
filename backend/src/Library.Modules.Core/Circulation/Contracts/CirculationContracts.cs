using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared.Persistence;
using MediatR;

namespace Library.Modules.Core.Circulation.Contracts;

public record HasActiveLoanForCopyQuery(int CopyId) : IRequest<bool>;
public record ReleaseCopyCommand(int BookId, int CopyId, long? ExcludeReservationId = null) : IRequest<CopyStatus>;
public record ProcessOverdueLoansCommand : IRequest<int>, ITransactionalCommand;
public record ExpireReservationsCommand : IRequest<int>, ITransactionalCommand;
public record CirculationStatsDto(
    int TotalActiveLoans,
    int TotalOverdueLoans,
    int PendingReservations,
    int TodayLoans,
    int TodayReturns,
    int PendingRenewals = 0,
    int ReadyReservations = 0,
    int WaitingReservations = 0,
    int DueTodayLoans = 0
);
public record GetCirculationStatsQuery(DateOnly TodayVn, DateTime StartUtc, DateTime EndUtc) : IRequest<CirculationStatsDto>;

