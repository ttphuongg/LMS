global using Library.Modules.Core.Circulation.Contracts;

using Library.Modules.Core.Catalog.Contracts;
using MediatR;

namespace Library.Modules.Core.Circulation.Contracts;

public enum IncidentType { Lost, Damaged }

public enum IncidentSeverity { Minor, Major, TotalLoss }

public enum IncidentStatus { Recorded, Resolved, Cancelled }

public record HasActiveLoanForCopyQuery(int CopyId) : IRequest<bool>;

public record ReleaseCopyCommand(int BookId, int CopyId, long? ExcludeReservationId) : IRequest<CopyStatus>;

public record ProcessOverdueLoansCommand : IRequest<int>;

public record ExpireReservationsCommand : IRequest<int>;
