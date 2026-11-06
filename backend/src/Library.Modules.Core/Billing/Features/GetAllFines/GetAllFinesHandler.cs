using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Features.GetAllFines;

public sealed class GetAllFinesHandler : IRequestHandler<GetAllFinesRequest, ApiResponse<GetAllFinesResult>>
{
    private readonly AppDbContext _db;
    public GetAllFinesHandler(AppDbContext db) => _db = db;

    public async Task<ApiResponse<GetAllFinesResult>> Handle(GetAllFinesRequest request, CancellationToken ct)
    {
        IQueryable<Fine> query = _db.Fines.AsNoTracking();

        if (request.Status.HasValue && Enum.IsDefined(typeof(FineStatus), request.Status.Value))
            query = query.Where(f => f.Status == (FineStatus)request.Status.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(f => f.IssuedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(f => new FineSummaryDto(f.Id, f.AccountId, f.FineType.ToString(), f.Amount, f.Status.ToString(), f.IssuedAt))
            .ToListAsync(ct);

        return ApiResponse<GetAllFinesResult>.Ok(new GetAllFinesResult(items, total));
    }
}
