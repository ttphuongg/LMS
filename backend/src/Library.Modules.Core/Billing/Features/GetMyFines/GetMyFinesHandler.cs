using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Features.GetMyFines;

public sealed class GetMyFinesHandler : IRequestHandler<GetMyFinesRequest, ApiResponse<List<FineDto>>>
{
    private readonly AppDbContext _db;
    public GetMyFinesHandler(AppDbContext db) => _db = db;

    public async Task<ApiResponse<List<FineDto>>> Handle(GetMyFinesRequest request, CancellationToken ct)
    {
        var fines = await _db.Set<Fine>()
            .Where(f => f.AccountId == request.AccountId)
            .OrderByDescending(f => f.IssuedAt)
            .Select(f => new FineDto(f.Id, f.FineType.ToString(), f.Amount, f.Status.ToString(), f.PaymentDueDate, f.IssuedAt))
            .ToListAsync(ct);

        return ApiResponse<List<FineDto>>.Ok(fines);
    }
}
