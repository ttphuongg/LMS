global using Library.Modules.Core.Billing.Contracts;

namespace Library.Modules.Core.Billing.Contracts;

public enum FineType { Overdue, Compensation, Other }

public enum FineStatus { Unpaid, PartiallyPaid, Paid, Cancelled }
