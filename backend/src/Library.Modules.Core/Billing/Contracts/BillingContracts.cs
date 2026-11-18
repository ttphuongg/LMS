global using Library.Modules.Core.Billing.Contracts;
using MediatR;

namespace Library.Modules.Core.Billing.Contracts;

public enum FineType { Overdue, Compensation, Other }

public enum FineStatus { Unpaid, PartiallyPaid, Paid, Cancelled }

public record HasUnpaidFinesQuery(int AccountId) : IRequest<bool>;

public record CheckCirculationFineRestrictionQuery(int AccountId, int GraceDays = 2) 
    : IRequest<CirculationFineRestrictionResult>;

public record CirculationFineRestrictionResult(
    bool IsRestricted,
    string? Reason = null,
    int OverdueFinesCount = 0,
    decimal TotalOverdueAmount = 0
);

public record GetUnpaidFinesTotalQuery() : IRequest<decimal>;
