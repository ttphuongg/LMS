using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Identity.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.GetAccountContact;

/// <summary>
/// Handler cung cap thong tin lien he (Email, Ho ten, SDT) cua tai khoan cho cac module khac qua MediatR,
/// tuan thu ranh gioi module (Module Boundary) cua Modular Monolith.
/// </summary>
public sealed class GetAccountContactHandler :
    IRequestHandler<GetAccountContactQuery, AccountContactDto?>,
    IRequestHandler<GetAccountContactsQuery, IReadOnlyDictionary<int, AccountContactDto>>
{
    private readonly IdentityDbContext _db;

    public GetAccountContactHandler(IdentityDbContext db) => _db = db;

    public async Task<AccountContactDto?> Handle(GetAccountContactQuery request, CancellationToken ct)
    {
        return await _db.Accounts
            .AsNoTracking()
            .Where(a => a.Id == request.AccountId)
            .Select(a => new AccountContactDto(
                a.Id,
                a.FullName,
                a.Email,
                a.Username,
                a.Status.ToString(),
                a.PhoneNumber))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<IReadOnlyDictionary<int, AccountContactDto>> Handle(GetAccountContactsQuery request, CancellationToken ct)
    {
        if (request.AccountIds.Count == 0)
            return new Dictionary<int, AccountContactDto>();

        return await _db.Accounts
            .AsNoTracking()
            .Where(a => request.AccountIds.Contains(a.Id))
            .Select(a => new AccountContactDto(
                a.Id,
                a.FullName,
                a.Email,
                a.Username,
                a.Status.ToString(),
                a.PhoneNumber))
            .ToDictionaryAsync(a => a.AccountId, a => a, ct);
    }
}

