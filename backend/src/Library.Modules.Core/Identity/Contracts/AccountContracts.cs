using MediatR;

namespace Library.Modules.Core.Identity.Contracts;

public record AccountSummary(int Id, string FullName, bool IsActive, string Username, string Status = "Active");
public record GetAccountSummaryQuery(int AccountId) : IRequest<AccountSummary?>;
public record GetAccountNamesQuery(IReadOnlyCollection<int> AccountIds) : IRequest<IReadOnlyDictionary<int, string>>;
public record SearchAccountIdsQuery(string Keyword) : IRequest<List<int>>;
public record GetTotalAccountsCountQuery() : IRequest<int>;
public record SeedDefaultAdminCommand : IRequest<bool>;

// ── Contact Contracts (Cho he thong Thong bao & Gui Email) ───────────────────
public record AccountContactDto(
    int AccountId,
    string FullName,
    string Email,
    string Username,
    string Status,
    string? PhoneNumber
);

public record GetAccountContactQuery(int AccountId) : IRequest<AccountContactDto?>;

public record GetAccountContactsQuery(IReadOnlyCollection<int> AccountIds) 
    : IRequest<IReadOnlyDictionary<int, AccountContactDto>>;

