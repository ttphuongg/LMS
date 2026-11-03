using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.GetMyProfile;

public sealed class GetMyProfileHandler : IRequestHandler<GetMyProfileRequest, ApiResponse<ProfileDto>>
{
    private readonly AppDbContext _db;
    public GetMyProfileHandler(AppDbContext db) => _db = db;

    public async Task<ApiResponse<ProfileDto>> Handle(GetMyProfileRequest request, CancellationToken ct)
    {
        var a = await _db.Accounts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.AccountId, ct);
        if (a == null) return ApiResponse<ProfileDto>.Fail("Tài kho?n không t?n t?i.");

        return ApiResponse<ProfileDto>.Ok(new ProfileDto(
            a.Id, a.Username, a.FullName, a.Email, a.PhoneNumber, a.Address, a.DateOfBirth,
            a.Role.ToString(), a.Status.ToString(), a.CreatedAt, a.LastLoginAt));
    }
}
