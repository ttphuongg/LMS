using FluentValidation;
using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.MarkAsRead;

public sealed class MarkAsReadHandler : IRequestHandler<MarkAsReadRequest, ApiResponse<bool>>
{
    private readonly NotificationsDbContext _db;
    private readonly IValidator<MarkAsReadRequest> _validator;

    public MarkAsReadHandler(NotificationsDbContext db, IValidator<MarkAsReadRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(MarkAsReadRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<bool>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var notif = await _db.Set<Notification>().FindAsync(new object[] { request.NotificationId }, ct);
        if (notif == null || notif.AccountId != request.AccountId)
            return ApiResponse<bool>.Fail("Notification not found or access denied.");

        notif.IsRead = true;
        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
