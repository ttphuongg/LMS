global using Library.Modules.Core.Billing.Contracts;
using MediatR;

namespace Library.Modules.Core.Billing.Contracts;

public enum FineType { Overdue, Compensation, Other }

public enum FineStatus { Unpaid, PartiallyPaid, Paid, Cancelled }

public record HasUnpaidFinesQuery(int AccountId) : IRequest<bool>;

public record GetUnpaidFinesTotalQuery() : IRequest<decimal>;
