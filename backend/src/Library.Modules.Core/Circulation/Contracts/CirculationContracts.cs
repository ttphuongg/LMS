global using Library.Modules.Core.Circulation.Contracts;

using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Shared.Persistence;
using MediatR;

namespace Library.Modules.Core.Circulation.Contracts;

public enum IncidentType { Lost, Damaged }

public enum IncidentSeverity { Minor, Major, TotalLoss }

public enum IncidentStatus { Recorded, Resolved, Cancelled }

public record HasActiveLoanForCopyQuery(int CopyId) : IRequest<bool>;

public record ReleaseCopyCommand(int BookId, int CopyId, long? ExcludeReservationId) : IRequest<CopyStatus>;

public record ProcessOverdueLoansCommand : IRequest<int>, ITransactionalCommand;

public record ExpireReservationsCommand : IRequest<int>, ITransactionalCommand;
